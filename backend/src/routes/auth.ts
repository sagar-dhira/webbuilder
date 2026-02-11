import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import JwksClient from "jwks-rsa";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logInfo } from "../lib/logger.js";
import { authenticateToken, JwtPayload } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "development";

function getKeycloakJwksClient() {
  const jwksUri = `${KEYCLOAK_URL.replace(/\/$/, "")}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;
  return JwksClient({ jwksUri, cache: true, cacheMaxAge: 600000 });
}

async function verifyKeycloakToken(accessToken: string): Promise<{ sub: string; email?: string; name?: string } | null> {
  if (!KEYCLOAK_URL) return null;
  try {
    const decoded = jwt.decode(accessToken, { complete: true }) as { header: { kid?: string }; payload?: { sub?: string; email?: string; name?: string; preferred_username?: string } } | null;
    if (!decoded?.header?.kid || !decoded?.payload?.sub) return null;
    const client = getKeycloakJwksClient();
    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();
    const issuer = `${KEYCLOAK_URL.replace(/\/$/, "")}/realms/${KEYCLOAK_REALM}`;
    const payload = jwt.verify(accessToken, publicKey, { algorithms: ["RS256"], issuer }) as { sub: string; email?: string; name?: string; preferred_username?: string };
    return {
      sub: payload.sub,
      email: payload.email ?? payload.preferred_username,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, msg: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email } as JwtPayload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logInfo("auth_register", "User registered", { email: user.email }, user.id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, msg: e.errors[0]?.message });
    }
    throw e;
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email } as JwtPayload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logInfo("auth_login", "User logged in", { email: user.email }, user.id);
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, msg: e.errors[0]?.message });
    }
    throw e;
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return res.status(404).json({ success: false, msg: "User not found" });
  logInfo("auth_me", "User fetched profile", {}, req.user!.userId);
  res.json({ success: true, user });
});

router.post("/keycloak-token", async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.body?.access_token as string) ?? null;
  if (!accessToken) {
    return res.status(401).json({ success: false, msg: "Missing Keycloak token" });
  }
  const payload = await verifyKeycloakToken(accessToken);
  if (!payload?.email) {
    return res.status(403).json({ success: false, msg: "Invalid or expired token" });
  }
  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    const randomPassword = await bcrypt.hash(`kc-${payload.sub}-${Date.now()}`, 10);
    user = await prisma.user.create({
      data: { email: payload.email, password: randomPassword, name: payload.name ?? undefined },
    });
    logInfo("auth_keycloak_register", "User created via Keycloak", { email: user.email }, user.id);
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  logInfo("auth_keycloak_token", "Keycloak token exchanged", { email: user.email }, user.id);
  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export { router as authRoutes };
