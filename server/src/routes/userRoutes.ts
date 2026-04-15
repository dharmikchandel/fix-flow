import { Router } from "express";
import {
  createUser,
  listUsers,
  getUser,
  toggleAvailability,
} from "../controllers/userController.js";
import { validate } from "../utils/validate.js";
import { createUserSchema } from "../models/validators.js";

const router = Router();

router.post("/", validate(createUserSchema), createUser);
router.get("/", listUsers);
router.get("/:id", getUser);
router.patch("/:id/availability", toggleAvailability);

export default router;
