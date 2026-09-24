import express from "express";
import {
  getAllPermissions,
  getGroupedPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../controller/permissionController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  hasPermission,
  requireFreshSession,
} from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.get("/", protect, hasPermission("permission:read"), getAllPermissions);
router.get(
  "/grouped",
  protect,
  hasPermission("permission:read"),
  getGroupedPermissions,
);
router.post(
  "/",
  protect,
  requireFreshSession,
  hasPermission("permission:create"),
  createPermission,
);
router.put(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("permission:update"),
  updatePermission,
);
router.delete(
  "/:id",
  protect,
  requireFreshSession,
  hasPermission("permission:delete"),
  deletePermission,
);

export default router;
