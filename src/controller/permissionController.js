import Permission from "../models/permission.js";
import Role from "../models/role.js";
import { successResponse, errorResponse } from "../utils/apiRespnse.js";

// @route GET /api/permissions
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, key: 1 });
    return successResponse(res, 200, "Permissions fetched successfully", {
      permissions: permissions,
    });
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

// @route GET /api/permissions/grouped
export const getGroupedPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, key: 1 });
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
    return successResponse(
      res,
      200,
      "Grouped permissions fetched successfully",
      {
        permissions: grouped,
      },
    );
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

// @route POST /api/permissions body: {key, label, description?, module}
export const createPermission = async (req, res) => {
  try {
    const { key, label, description, module } = req.body;

    // Validation
    if (!key?.trim() || !label?.trim() || !module?.trim()) {
      return errorResponse(
        res,
        400,
        "Key, label and module are required",
        "PERMISSION_DATA_INVALID",
      );
    }
    const normalizedKey = key.trim().toLowerCase();

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ key: normalizedKey });
    if (existingPermission) {
      return errorResponse(
        res,
        400,
        "Permission with this key already exists",
        "PERMISSION_ALREADY_EXISTS",
      );
    }

    // Create new permission
    const permission = new Permission.create({
      key: normalizedKey,
      label: label.trim(),
      description,
      module: module.trim().toLowerCase(),
    });

    return successResponse(res, 201, "Permission created successfully", {
      permission: permission,
    });
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

// @route PUT /api/permissions/:id
export const updatePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return errorResponse(
        res,
        404,
        "Permission not found",
        "PERMISSION_NOT_FOUND",
      );
    }

    if (
      permission.isSystem &&
      req.body.key &&
      req.body.key !== permission.key
    ) {
      return errorResponse(
        res,
        400,
        "System permissions cannot be renamed",
        "SYSTEM_PERMISSION_LOCKED",
      );
    }
    const { key, label, description, module } = req.body;

    // Update permission

    if (!permission.isSystem && key) permission.key = key.trim().toLowerCase();
    if (label !== undefined) permission.label = label.trim();
    if (description !== undefined) permission.description = description;
    if (module !== undefined) permission.module = module.trim().toLowerCase();
    await permission.save();

    return successResponse(res, 200, "Permission updated successfully", {
      permission: permission,
    });
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

// @route DELETE /api/permissions/:id
export const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return errorResponse(
        res,
        404,
        "Permission not found",
        "PERMISSION_NOT_FOUND",
      );
    }

    if (permission.isSystem) {
      return errorResponse(
        res,
        400,
        "System permissions cannot be deleted",
        "SYSTEM_PERMISSION_LOCKED",
      );
    }

    // Check if any role uses this permission
    const roles = await Role.countDocuments({ permissions: permission._id });
    if (roles > 0) {
      return errorResponse(
        res,
        409,
        `Cannot delete ${roles}: Assigned to roles`,
        "PERMISSION_IN_USE",
      );
    }

    await permission.deleteOne();
    return successResponse(res, 200, "Permission deleted successfully");
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};
