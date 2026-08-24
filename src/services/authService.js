import User from "../model/user.js";
import jwt from "jsonwebtoken";

const ONE_HOUR_MS = 30 * 1000; // 1 hour in milliseconds

export const generateTokens = (user, lastActivity) => {
    const accessToken = jwt.sign(
        { email: user.userEmail, id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id, lastActivity: lastActivity },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
}

export const refreshToken = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw { status: 404, message: "Refresh token is required" };
    }
    let decode;
    try {
        decode = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw { status: 403, message: "Invalid or expired refresh token" };
    }

    const lastActivity = new Date(decode.lastActivity);
    const now = new Date();
    if (now - lastActivity > ONE_HOUR_MS) {
        await User.findByIdAndUpdate(decode.id, { refreshToken: null, lastActivity: null })
        throw {
            status: 403,
            message: "Session expired due to inactivity. Please login again",
            errorCode: "SESSION_EXPIRED"
        };
    }
    const user = await User.findById(decode.id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
        if (user) {
            user.refreshToken = null;
            user.lastActivity = null;
            await user.save();
        }
        throw { status: 403, message: "Refresh token reuse detected. Please login again" };
    }
    const newlastActivity = new Date();
    const { accessToken, refreshToken } = generateTokens(user, newlastActivity);
    user.refreshToken = refreshToken;
    user.lastActivity = newlastActivity;
    await user.save();
    return { accessToken, refreshToken };
}

export const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null, lastActivity: null });
}




