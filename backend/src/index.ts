import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth.js";
import { siteRoutes } from "./routes/sites.js";
import { publicRoutes } from "./routes/public.js";
import { logRoutes } from "./routes/logs.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", publicRoutes);
app.use("/api/sites", siteRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Framely backend running on http://localhost:${PORT}`);
});
