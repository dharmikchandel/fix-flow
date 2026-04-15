import { Router } from "express";
import { getPriorityQueue } from "../controllers/priorityController.js";

const router = Router();

router.get("/", getPriorityQueue);

export default router;
