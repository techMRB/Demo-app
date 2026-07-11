import { login, refresh, logout } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);

export default router;