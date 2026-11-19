import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/apiRespnse.js";

export const profileImageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(
            res,
            429,
            "Too many requests from this IP, please try again after a minute.",
            "TOO_MANY_REQUESTS"
        );
    }
});