import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { requireAuth } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";

const router = Router();

router.post("/register", authRateLimit, validateBody(registerSchema), register);
router.post("/login", authRateLimit, validateBody(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
