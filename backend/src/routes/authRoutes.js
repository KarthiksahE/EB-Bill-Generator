import { Router } from "express";
import { login, me, signup, updateProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.put("/profile", authMiddleware, updateProfile);

export default router;
