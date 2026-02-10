import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { logInfo } from "../lib/logger.js";

const router = Router();

router.get("/site/:subdomain", async (req, res) => {
  const site = await prisma.page.findUnique({
    where: { subdomain: req.params.subdomain },
  });

  if (!site) {
    return res.status(404).json({ success: false, msg: "Site not found" });
  }

  if (!site.visible) {
    logInfo("public_site_view", "Private site viewed", { subdomain: req.params.subdomain });
    return res.json({
      success: true,
      private: true,
      msg: "The requested site is private (for now), come back later!",
    });
  }

  logInfo("public_site_view", "Public site viewed", { subdomain: site.subdomain, siteId: site.id });
  res.json({ success: true, site });
});

export { router as publicRoutes };
