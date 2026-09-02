import { login, refresh, logout } from "../controller/authController.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);


export default router;