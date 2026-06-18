import { generateTokens } from "../services/authService.js";
import User from "../model/user.js";
import bcrypt from "bcrypt";

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
            return res.status(404).json({ message: "Entered email does not exist. Please enter correct one." });
            //return errorResponse(res, 404, "Entered email does not exist. Please enter correct one.");
        }
        const isPasswordValid = await bcrypt.compare(password, user.user_password);
        if (!isPasswordValid) {
            return res.status(404).json({ message: "Invalid email and password" });
            //return errorResponse(res, 404, "Invalid email and password");
        }
        if (!user.isVerified) {
            return res.status(403).json({ message: "Email address is not verified yet. Please verify your email before logging in" });
            //return errorResponse(res, 403, "Email address is not verified yet. Please verify your email before logging in");
        }
        const { accessToken, refreshToken } = generateTokens(user);

        // save refresh token in database for revocation later
        user.refreshToken = refreshToken;
        await user.save();

        // set refresh token in httpOnly cookie
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        return res.status(200).json({
            message: "Signed in successfully",
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
        // return successResponse(res, 200, "Signed in successfully", {
        //     success: true,
        //     token_type: "Bearer",
        //     expired_in: 15 * 60, // 15 minutes in seconds
        //     accessToken: accessToken,
        //     user: {
        //         id: user._id,
        //         name: user.user_name,
        //         email: user.user_email
        //     }
        // });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error" });
        // return errorResponse(res, 500, "Iternal server error");
    }
}


