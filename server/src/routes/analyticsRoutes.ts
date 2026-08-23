import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getAnalytics);

export default router;
