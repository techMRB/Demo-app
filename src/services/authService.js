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


