import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import type { Request, Response } from "express";

import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import priorityRoutes from "./routes/priorityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

// Most hosts (Render, Railway, Fly, etc.) put the app behind one reverse
// proxy hop. Without this, express-rate-limit can't tell real client IPs
// apart — every request looks like it's coming from the proxy.
app.set("trust proxy", 1);

// Middleware
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(morgan("dev"));

// A generous ceiling on the whole API — not a substitute for the tighter
// per-route limiter on login, just a backstop against one client hammering
// the server (POST /bugs in particular runs a full duplicate-detection scan).
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Health Check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/assign", assignmentRoutes);
app.use("/api/priority", priorityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/notifications", notificationRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
