import { Router } from "express";
import { getPriorityQueue } from "../controllers/priorityController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getPriorityQueue);

export default router;
