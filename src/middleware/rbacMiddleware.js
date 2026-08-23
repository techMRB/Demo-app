import User from "../model/user.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ errorCode: "UNAUTHORIZED", message: "Unauthorized" });
        }
        if (!allowedRoles.includes(req.user.role)) {  
            return res.status(403).json({ errorCode: "FORBIDDEN_ROLE",  message: "Your role does not have permission to access this resource" });
        }
        next();
    };
};

export const requireFreshSession = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("userRole tokenVersion lastActivity");
        if (!user) {
            return res.status(401).json({ errorCode: "USER_NOT_FOUND", message: "User not found" });
        }
        if (user.tokenVersion !== req.user.tokenVersion) {
            return res.status(401).json({ errorCode: "TOKEN_VERSION_MISMATCH", message: "Token version mismatch. Please login again." });
        }
        req.user.role = user.userRole;
        user.lastActivity = new Date();
        await user.save();
        next();
    } catch (error) {
        return res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
    }
};