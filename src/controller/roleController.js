import Role from "../models/role.js";
import Permission from "../models/permission.js";
import User from "../models/user.js";
import { successResponse, errorResponse } from "../utils/apiRespnse.js";

// get all added roles
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions").sort({ name: 1 });
    return successResponse(res, 200, "Roles fetched successfully", {
      roles: roles,
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

// get role by id
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate("permissions");
    if (!role) {
      return errorResponse(res, 404, "Role not found", "ROLE_NOT_FOUND");
    }
    return successResponse(res, 200, "Role fetched successfully", {
      role: role,
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

// create new role
export const createRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name?.trim()) {
      return errorResponse(
        res,
        400,
        "Role name is required",
        "ROLE_NAME_REQUIRED",
      );
    }
    const normalizedRoleName = name.trim().toLowerCase();
    const existingRole = await Role.findOne({ name: normalizedRoleName });

    if (existingRole) {
      return errorResponse(
        res,
        400,
        "Role already exists",
        "ROLE_ALREADY_EXISTS",
      );
    }

    const validPermissionIds = validatePermissionIds(permissionIds);
    if (validPermissionIds === null) {
      return errorResponse(
        res,
        400,
        "Some permissions are invalid",
        "INVALID_PERMISSIONS",
      );
    }

    const role = new Role.create({
      name: normalizedRoleName,
      permissions: permissionIds,
      description,
    });

    const populated = await role.populate("permissions");
    return successResponse(res, 201, "Role created successfully", {
      role: populated,
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

// update existing role
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return errorResponse(res, 404, "Role not found", "ROLE_NOT_FOUND");
    }

    if (role.isSystem && req.body.name && req.body.name !== role.name) {
      return errorResponse(
        res,
        400,
        "System roles cannot be renamed",
        "SYSTEM_ROLE_LOCKED",
      );
    }

    const { description, permissionIds, name } = req.body;
    let permissionChanged = false;

    if (permissionIds !== undefined) {
      const validPermissionIds = await validatePermissionIds(permissionIds);
      if (validPermissionIds === null) {
        return errorResponse(
          res,
          400,
          "Some permissions are invalid",
          "INVALID_PERMISSIONS",
        );
      }
      const currentIds = role.permissions.map((id) => id.toString()).sort();
      const nextIds = validPermissionIds.map((id) => id.toString()).sort();
      permissionChanged =
        JSON.stringify(currentIds) !== JSON.stringify(nextIds);
      role.permissions = validPermissionIds;
    }

    if (description !== undefined) role.description = description;
    if (!role.isSystem && name) role.name = name.trim().toLowerCase();

    await role.save();
    if (permissionChanged) {
      await User.updateMany(
        { userRole: role._id },
        { $inc: { tokenVersion: 1 } },
      );
    }

    const populated = await role.populate("permissions");
    return successResponse(res, 200, "Role updated successfully", {
      role: populated,
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

// delete role
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return errorResponse(res, 404, "Role not found", "ROLE_NOT_FOUND");
    }

    if (role.isSystem) {
      return errorResponse(
        res,
        400,
        "System roles cannot be deleted",
        "SYSTEM_ROLE_LOCKED",
      );
    }

    const users = await User.countDocuments({ userRole: role._id });
    if (users > 0) {
      return errorResponse(
        res,
        409,
        "Cannot delete - ${users} as user(s) are assigned to it",
        "ROLE_HAS_USERS",
      );
    }

    await role.deleteOne();
    return successResponse(res, 200, "Role deleted successfully");
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

// validate permission ids
const validatePermissionIds = async (permissionIds) => {
  if (!permissionIds || !Array.isArray(permissionIds)) {
    return [];
  }
  const permissions = await Permission.find({
    _id: { $in: permissionIds },
  }).select("_id");
  if (permissions.length !== permissionIds.length) {
    return null;
  }
  return permissions.map((p) => p._id);
};
