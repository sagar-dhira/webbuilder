import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { fetchSupersetCharts, getSupersetBaseUrl } from "../services/superset.js";
import { logInfo } from "../lib/logger.js";

const router = Router();

/**
 * GET /api/superset/charts
 * Returns list of Superset charts. Requires user to be logged in (JWT or Keycloak token).
 * Backend fetches token from Superset using env credentials and caches it.
 */
router.get("/charts", authenticateToken, async (req, res) => {
  try {
    const charts = await fetchSupersetCharts();
    const baseUrl = getSupersetBaseUrl();

    logInfo("superset_charts", "User fetched Superset charts", { count: charts.length }, req.user!.userId);

    res.json({
      success: true,
      charts,
      baseUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch Superset charts";
    res.status(502).json({
      success: false,
      msg: message,
    });
  }
});

/**
 * GET /api/superset/config
 * Returns Superset base URL for embedding. Requires user to be logged in.
 */
router.get("/config", authenticateToken, (req, res) => {
  const baseUrl = getSupersetBaseUrl();
  res.json({ success: true, baseUrl });
});

export { router as supersetRoutes };
