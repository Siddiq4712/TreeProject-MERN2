import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./models/index.js";
import routes from "./routes/index.js";
import { ensureAdminAccount } from "./services/authService.js";
import { loadEnvConfig } from "./config/env.js";
import { runDailyTreeHealthAudit } from "./services/treeService.js";

dotenv.config();

const env = loadEnvConfig();
const app = express();
app.disable('x-powered-by');

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (env.corsOrigins === "*") {
        return callback(null, true);
      }

      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Routes
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", routes);

const scheduleDailyTreeAudit = () => {
  const runAudit = async () => {
    try {
      const result = await runDailyTreeHealthAudit();
      console.log(`Daily tree health audit completed. Updated ${result.updated} trees.`);
    } catch (error) {
      console.error('Daily tree health audit failed:', error);
    }
  };

  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(0, 15, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const initialDelay = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    runAudit();
    setInterval(runAudit, 24 * 60 * 60 * 1000);
  }, initialDelay);
};

// Database Connection & Server Start
(async () => {
  try {
    await db.connectDB();
    await ensureAdminAccount();
    scheduleDailyTreeAudit();

    app.listen(env.port, env.host, () => {
      console.log(`Server running on ${env.host}:${env.port}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
})();
