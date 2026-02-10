import { Request, Response, NextFunction } from "express";
import { logRequest } from "../lib/logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const userId = (req as Request & { user?: { userId: string } }).user?.userId ?? null;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logRequest({
      message: `${req.method} ${req.path} ${res.statusCode}`,
      userId,
      meta: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        userAgent: req.get("user-agent") ?? undefined,
      },
      action: "request",
    });
  });

  next();
}
