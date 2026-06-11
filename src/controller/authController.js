import { generateTokens, refreshTokens, logoutUser } from "../services/authService.js";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { errorResponse, successResponse } from "../utils/apiResponses.js";

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ user_email: email });
        if (!user) {
            return errorResponse(res, 404, "Entered email does not exist. Please enter correct one.");
        }
        const isPasswordValid = await bcrypt.compare(password, user.user_password);
        if (!isPasswordValid) {
            return errorResponse(res, 404, "Invalid email and password");
        }
        if (!user.isVerified) {
            return errorResponse(res, 403, "Email address is not verified yet. Please verify your email before logging in");
        }
        const { accessToken, refreshToken } = generateTokens(user);

        // save refresh token in database for revocation later
        user.refreshToken = refreshToken;
        await user.save();

        // set refresh token in httpOnly cookie
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        // res.status(result.status).json({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
        return successResponse(res, 200, "Signed in successfully", {
            success: true,
            token_type: "Bearer",
            expired_in: 15 * 60, // 15 minutes in seconds
            accessToken: accessToken,
            user: {
                id: user._id,
                name: user.user_name,
                email: user.user_email
            }
        });
    } catch (error) {
        return errorResponse(res, 500, "Iternal server error");
    }
}

export const refresh = async (req, res) => {
    try {
        const incomingToken = req.cookies?.refreshToken;
        const result = await refreshTokens(incomingToken);
        // set new refresh token in httpOnly cookie
        res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
        return successResponse(res, 200, "Token refreshed successfully", {
            success: true,
            message: "Token refreshed successfully",
            token_type: "Bearer",
            expired_in: 15 * 60, // 15 minutes in seconds
            accessToken: result.accessToken
        });
    } catch (error) {
        res.clearCookie("refreshToken")
        return errorResponse(res, 500, "Iternal server error");
    }
}

export const logout = async (req, res) => {
    try {
        await logoutUser(req.user._id);
        res.clearCookie("refreshToken");
        return successResponse(res, 200, "Logged out successfully", {
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return errorResponse(res, 500, "Iternal server error");
    }
}
