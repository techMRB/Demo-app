import { login, logout, refresh } from "../controller/authController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protectedRoute, logout);

export default router;