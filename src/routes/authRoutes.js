import { login, refresh } from "../controller/authController.js";
import express from "express";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);


export default router;