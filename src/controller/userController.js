import User from "../models/user.js";
import { sendEmail } from "../utils/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Role from "../models/role.js";
import { POPULATE_ROLE } from "../utils/constants.js";
import { successResponse, errorResponse } from "../utils/apiRespnse.js";

dotenv.config();
// Create a new user
export const createUser = async (req, res) => {
  try {
    const { userPassword } = req.body;
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(userPassword, salt);
    // req.body.userPassword = hashedPassword;
    const defaultRole = await Role.findOne({ name: "user" });
    if (!defaultRole) {
      return errorResponse(
        res,
        400,
        "Default role not found",
        "ROLE_NOT_FOUND",
      );
    }
    req.body.userRole = defaultRole._id;
    const token = jwt.sign(
      { email: req.body.userEmail },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    const user = await User.create(req.body);
    if (user) {
      const subject = "Welcome to Demo App - Please Verify Your Email";
      const html = `
                <p>Hello ${user.userName},</p>
                <p>Welcome to the Demo App.<p/> 
                <p>Please verify your email by clicking the button below:</p>
                <a href="http://localhost:3000/verify-email/${token}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>This token will expire in 24 hours.</p>
                <p>Thank you for joining us!</p>
                <p>Best regards,<br>Demo App Team</p>
            `;
      await sendEmail(user.userEmail, subject, html);
    }

    const safeUser = user.toObject();
    delete safeUser.userPassword;

    return successResponse(res, 201, "User created successfully", {
      user: safeUser,
    });
  } catch (error) {
    console.log("Error creating user", error);
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

//verify user email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ user_email: decoded.email });
    if (!user) {
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND");
    }
    user.isVerified = true;
    await user.save();
    return successResponse(res, 200, "Email verified successfully!");
  } catch (error) {
    console.log("Error verifying email", error);
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

//get all users
export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().populate(POPULATE_ROLE);
    return successResponse(res, 200, "Users fetched successfully", {
      users: allUsers,
    });
  } catch (error) {
    console.log("Error fetching users", error);
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};

//get user by id
export const getUserById = async (req, res) => {
  try {
    console.log(req);
    const userdetails = await User.findById(req.params.id).populate(
      POPULATE_ROLE,
    );
    if (!userdetails) {
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND");
    }
    return successResponse(res, 200, "User details fetched successfully", {
      user: userdetails,
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

//updat user details
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) {
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND");
    }
    return successResponse(res, 200, "User details updated successfully", {
      user: user,
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

export const updateUserRole = async (req, res) => {
  try {
    const { role: roleName } = req.body;
    if (!roleName) {
      return errorResponse(res, 400, "Role is required", "ROLE_REQUIRED");
    }
    if (req.params.id === req.user.id) {
      return errorResponse(
        res,
        400,
        "You cannot update your own role",
        "SELF_ROLE_UPDATE",
      );
    }
    const role = await Role.findOne({ name: roleName.trim().toLowerCase() });
    if (!role) {
      return errorResponse(res, 400, "Role not found", "ROLE_NOT_FOUND");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND");
    }
    user.userRole = role._id;
    await user.invalidateSessions();
    return successResponse(res, 200, "User role updated successfully", {
      user: user,
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

// delete user
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return errorResponse(
        res,
        400,
        "You cannot delete your own account",
        "SELF_ACCOUNT_DELETE",
      );
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND");
    }
    return successResponse(res, 200, "User deleted successfully");
  } catch (error) {
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};
