import User from "../models/user.js";
import { sendEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Role from "../models/role.js";
import { POPULATE_ROLE } from "../utils/constants.js";
import { successResponse, errorResponse } from "../utils/apiRespnse.js";
import { processProfileImage, deleteProfileImages, hasImage } from "../services/imageService.js";

dotenv.config();

const EMPTY_PROFILE_IMAGE = {
  original: null,
  mobile: null,
  tablet: null,
  laptop: null,
  desktop: null,
  updatedAt: null,
}

// Fields nobody can set through req.body
// (profileImage is changes only via file upload/ removeImage flag)
const ALWAYS_PROTECTED = ["_id", "userRole", "profileImage", "removeImage"];

// Fields only Admin can set through req.body
const ADMIN_ONLY_FIELDS = ["userRole", "userPassword"];
// Create a new user
export const createUser = async (req, res) => {
  try {
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
    await user.populate(POPULATE_ROLE);
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

    return successResponse(res, 201, "User created successfully", {
      user: user.toSafeJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      if (duplicateField === "userEmail") {
        return errorResponse(
          res,
          409,
          "Email already exists",
          "DUPLICATE_EMAIL",
        );
      }
      if (duplicateField === "userContact") {
        return errorResponse(
          res,
          409,
          "Contact number already exists",
          "DUPLICATE_CONTACT",
        );
      }
    }
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
    const hasUserRead = (req.user.permissions || []).includes("user:read");
    if (!hasUserRead) {
      const self = await User.findById(req.user.id).populate(POPULATE_ROLE);
      return successResponse(res, 200, "Users fetched successfully", {
        users: [self.toSafeJSON()],
      });
    }
    const allUsers = await User.find().populate(POPULATE_ROLE);
    return successResponse(res, 200, "Users fetched successfully", {
      users: allUsers.map((u) => u.toSafeJSON()),
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
    const userdetails = await User.findById(req.params.id).populate(
      POPULATE_ROLE,
    );
    if (!userdetails) {
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND");
    }
    return successResponse(res, 200, "User details fetched successfully", {
      user: userdetails.toSafeJSON(),
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
  let newImages = null;
  let committed = false;

  try {
    const userId = req.params.id;
    const isAdmin = req.user?.role === "admin";

    // Only admin or the account owner can update
    if (!isAdmin && userId !== req.user.id) {
      return errorResponse(res, 403, "Access denied", "ACCESS_DENIED");
    }

    // Build allowed updates from body 
    const updates = { ...req.body }
    ALWAYS_PROTECTED.forEach((field) => delete updates[field])

    if (isAdmin) {
      ADMIN_ONLY_FIELDS.forEach((field) => delete updates[field])
    }

    const removeImage = req.body.removeImage === "true" || req.body.removeImage === true

    if (req.file && removeImage) {
      return errorResponse(res, 400, "Cannot update image and remove image at the same time", "IMAGE_UPDATE_CONFLICT")
    }
    // Handle profile image update/upload
    if (req.file) {
      const userExists = await User.findById(userId)
      if (!userExists) {
        return errorResponse(res, 404, "User not found", "USER_NOT_FOUND")
      }

      newImages = await processProfileImage(req.file.buffer, userId)
      updates.profileImage = newImages
    } else if (removeImage) {
      updates.profileImage = EMPTY_PROFILE_IMAGE
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, "No updates provided", "NO_UPDATES_PROVIDED")
    }

    // new: false -> returns the document BEFORE the update,
    // so we kno exactly which old image files to delete
    const previous = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        returnDocument: 'before',
        runValidators: true,
        projection: { profileImage: 1 },
        lean: true
      }
    );

    if (!previous) {
      if (newImages) await deleteProfileImages(newImages);
      return errorResponse(res, 404, "User not found", "USER_NOT_FOUND")
    }

    committed = true;

    // Delete old image files only if the image was replaced or removed
    const hadImage = hasImage(previous.profileImage);
    if ((req.file || removeImage) && hadImage) {
      try {
        await deleteProfileImages(previous.profileImage)
      } catch (cleanupErr) {
        console.error("Failed to delete old profile images:", cleanupErr)
      }
    }
    const user = await User.findById(userId).select("-userPassword")
    let message = "User details updated successfully";
    if (req.file) message = hadImage ? "Profile image updated" : "Profile image uploaded";
    else if (removeImage) message = hadImage ? "Profile image removed" : "No profile image to remove";
    return successResponse(res, 200, message, {
      user: user,
    })
  } catch (error) {
    // Remove new files only if they were never linked to the user
    if (newImages && !committed) {
      await deleteProfileImages(newImages).catch(() => { })
    }
    console.error("updateUser error:", error)
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
    const updatedUser = await User.findById(user._id).populate(POPULATE_ROLE);
    return successResponse(res, 200, "User role updated successfully", {
      user: updatedUser.toSafeJSON(),
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
    // Delete image files after the user is removed
    if (hasImage(user.profileImage)) {
      try {
        await deleteProfileImages(user.profileImage)
      } catch (cleanupErr) {
        console.error("Failed to delete profile images for deleted user:", cleanupErr)
      }
    }
    return successResponse(res, 200, "User deleted successfully");
  } catch (error) {
    console.error("deleteUser error:", error)
    return errorResponse(
      res,
      error.status || 500,
      error.message || "Internal server error",
      error.errorCode,
    );
  }
};
