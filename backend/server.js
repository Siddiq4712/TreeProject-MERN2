import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./models/index.js";
import routes from "./routes/index.js";
import { ensureAdminAccount } from "./services/authService.js";
import { loadEnvConfig } from "./config/env.js";

dotenv.config();

const env = loadEnvConfig();
const app = express();

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
app.use(express.json());

// Routes
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", routes);

// Database Connection & Server Start
(async () => {
  try {
    await db.connectDB();
    await ensureAdminAccount();

    app.listen(env.port, env.host, () => {
      console.log(`Server running on ${env.host}:${env.port}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
})();
