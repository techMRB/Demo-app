import { generateTokens, refreshToken } from "../services/authService.js";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { successResponse, errorResponse } from "../utils/apiRespnse.js";

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ userEmail: email });
        if (!user) {
            return errorResponse(
                res,
                404,
                "Entered email does not exist. Please enter correct one.",
                "USER_NOT_FOUND"
            );
        }
        const isPasswordValid = await bcrypt.compare(password, user.userPassword);
        if (!isPasswordValid) {
            return errorResponse(
                res,
                401,
                "Invalid email or password",
                "INVALID_CREDENTIALS"
            );
        }
        if (!user.isVerified) {
            return errorResponse(
                res,
                403,
                "Email address is not verified yet. Please verify your email before logging in",
                "EMAIL_NOT_VERIFIED"
            );
        }
        const lastActivity = new Date();
        const { accessToken, refreshToken } = generateTokens(user, lastActivity);

        // save refresh token in database for revocation later
        user.refreshToken = refreshToken;
        user.lastActivity = lastActivity;
        await user.save();

        // set refresh token in httpOnly cookie
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
        return successResponse(res, 200, "Signed in successfully", {
            success: true,
            token_type: "Bearer",
            expired_in: 15 * 60, // 15 minutes in seconds
            accessToken: accessToken,
            user: {
                id: user._id,
                name: user.userName,
                email: user.userEmail
            }
        });
    } catch (error) {
        console.error("Error during login:", error);
        return errorResponse(
            res,
            error.status || 500,
            error.message || "Internal server error",
            error.errorCode
        );
    }
}

export const refresh = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken;
        const result = await refreshToken(incomingRefreshToken);
        res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
        return successResponse(res, 200, "Token refreshed successfully", {
            success: true,
            token_type: "Bearer",
            expired_in: 15 * 60, // 15 minutes in seconds
            accessToken: result.accessToken
        });
    } catch (error) {
        console.log(error)
        res.clearCookie("refreshToken");
        return errorResponse(
            res,
            error.status || 500,
            error.message || "Internal server error",
            error.errorCode
        );
    }
}

