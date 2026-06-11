import User from "../model/user.js";
import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";

export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { email: user.user_email, id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
}

export const refreshTokens = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw { status: 401, message: "No refresh token provided" };
    }
    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw { status: 403, message: "Invalid or expired refresh token" };
    }
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== incomingRefreshToken) {
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        throw { status: 403, message: "Refresh token reuse detected. Please login again" };
    }
    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
}

export const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
}
