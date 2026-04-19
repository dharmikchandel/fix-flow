import express from "express";
import cors from "cors";
import morgan from "morgan";

import type { Request, Response } from "express";

import bugRoutes from "./routes/bugRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import priorityRoutes from "./routes/priorityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health Check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/bugs", bugRoutes);
app.use("/api/assign", assignmentRoutes);
app.use("/api/priority", priorityRoutes);
app.use("/api/users", userRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
