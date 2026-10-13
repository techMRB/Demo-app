import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,
  updateUserRole,
} from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  requireFreshSession,
  hasPermission,
} from "../middleware/rbacMiddleware.js";
const router = express.Router();

router.post("/register", createUser);
router.get("/verify-email/:token", verifyEmail);

router.get("/get-all-users", protect, hasPermission("user:read"), getAllUsers);
router.get(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("user:read"),
  getUserById,
);
router.put(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("user:update"),
  updateUser,
);
router.delete(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("user:delete"),
  deleteUser,
);
router.put(
  "/:id/role",
  protect,
  requireFreshSession,
  hasPermission("user:update"),
  updateUserRole,
);

export default router;
