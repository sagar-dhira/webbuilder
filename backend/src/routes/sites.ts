import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logInfo } from "../lib/logger.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

const createSiteSchema = z.object({
  title: z.string().min(1).max(100),
  subdomain: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Subdomain must be lowercase alphanumeric with hyphens"),
});

router.use(authenticateToken);

router.get("/", async (req, res) => {
  const sites = await prisma.page.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
  });
  logInfo("sites_list", "User listed sites", { count: sites.length }, req.user!.userId);
  res.json({ success: true, sites });
});

router.post("/", async (req, res) => {
  try {
    const { title, subdomain } = createSiteSchema.parse(req.body);

    const existing = await prisma.page.findFirst({ where: { subdomain } });
    if (existing) {
      return res.status(400).json({ success: false, msg: "Subdomain is already in use" });
    }

    const site = await prisma.page.create({
      data: { userId: req.user!.userId, title, subdomain },
    });
    logInfo("sites_create", "User created site", { siteId: site.id, title, subdomain }, req.user!.userId);
    res.status(201).json({ success: true, site });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, msg: e.errors[0]?.message });
    }
    throw e;
  }
});

router.get("/:id", async (req, res) => {
  const site = await prisma.page.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!site) return res.status(404).json({ success: false, msg: "Site not found" });
  logInfo("sites_get", "User fetched site", { siteId: site.id }, req.user!.userId);
  res.json({ success: true, site });
});

router.put("/:id", async (req, res) => {
  const site = await prisma.page.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!site) return res.status(404).json({ success: false, msg: "Site not found" });

  const { title, subdomain, previewImage, content, visible } = req.body;

  const updated = await prisma.page.update({
    where: { id: req.params.id },
    data: {
      ...(title != null && { title }),
      ...(subdomain != null && { subdomain }),
      ...(previewImage != null && { previewImage }),
      ...(content != null && { content }),
      ...(visible != null && { visible }),
    },
  });
  logInfo("sites_update", "User updated site", { siteId: updated.id }, req.user!.userId);
  res.json({ success: true, site: updated });
});

router.delete("/:id", async (req, res) => {
  const site = await prisma.page.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!site) return res.status(404).json({ success: false, msg: "Site not found" });

  await prisma.page.delete({ where: { id: req.params.id } });
  logInfo("sites_delete", "User deleted site", { siteId: req.params.id }, req.user!.userId);
  res.json({ success: true });
});

export { router as siteRoutes };
