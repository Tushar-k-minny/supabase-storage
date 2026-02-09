import { Router } from "express";
import { handleAskJiji } from "../controllers/ask-jiji.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  askJijiSchema,
  validateBody,
} from "../middleware/validation.middleware.js";

const router: Router = Router();

// POST /ask-jiji - Protected route requiring authentication
router.post("/", authenticate, validateBody(askJijiSchema), handleAskJiji);

export default router;
