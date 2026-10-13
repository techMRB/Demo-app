import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controller/roleController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  hasPermission,
  requireFreshSession,
} from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Define routes for role management
router.get("/", protect, hasPermission("role:read"), getAllRoles);
router.get("/:id", protect, hasPermission("role:read"), getRoleById);
router.post(
  "/",
  protect,
  requireFreshSession,
  hasPermission("role:create"),
  createRole,
);
router.put(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("role:update"),
  updateRole,
);
router.delete(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("role:delete"),
  deleteRole,
);

export default router;
