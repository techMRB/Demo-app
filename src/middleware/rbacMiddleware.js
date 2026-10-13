import User from "../models/user.js";

export const hasPermission =
  (...requiredPermissions) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "Authentication required to check permissions.",
      });
    }

    const userPermissions = req.user.permissions || [];
    const isAllowed = requiredPermissions.some((p) =>
      userPermissions.includes(p),
    );

    if (!isAllowed) {
      return res.status(403).json({
        errorCode: "FORBIDDEN_PERMISSION",
        message: `Insufficient permissions: ${requiredPermissions.join(" or ")}`,
      });
    }
    next();
  };

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "Authentication required to authorize this request.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

export const requireFreshSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("userRole tokenVersion lastActivity")
      .populate({ path: "userRole", populate: { path: "permissions" } });
    if (!user) {
      return res
        .status(401)
        .json({ errorCode: "USER_NOT_FOUND", message: "User not found" });
    }

    if (user.tokenVersion !== req.user.tokenVersion) {
      return res.status(401).json({
        errorCode: "TOKEN_VERSION_MISMATCH",
        message: "Token version mismatch. Please log in again.",
      });
    }

    req.user.role = user.userRole.name;
    req.user.permissions = user.userRole.permissions.map((p) => p.key);
    req.user.lastActivity = new Date();
    await user.save();
    next();
  } catch (error) {
    return res.status(500).json({
      errorCode: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  }
};
