import { errorResponse } from "../utils/apiRespnse.js";
// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errorCode = err.code || "INTERNAL_SERVER_ERROR";

    if (err.name === 'CastError') {
        return errorResponse(res, 400, "Invalid ID format", "INVALID_ID");
    }

    return errorResponse(res, statusCode, message, errorCode);
}