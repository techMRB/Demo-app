import multer from "multer";
import path from "path";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, ALLOWED_IMAGE_EXTENSIONS } from "../utils/constants.js";
import { errorResponse } from "../utils/apiRespnse.js";

// Keep the file in memory;  sharp processes it before saving to disk
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const isExtAllowed = ALLOWED_IMAGE_EXTENSIONS.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
        return cb(null, true);
    }

    return cb({
        message: "Invalid file type. Only JPEG, PNG, and GIF are allowed.",
        code: "INVALID_FILE_TYPE",
        statusCode: 400
    });
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 }
});

// Wrapper that turns multer errors in to clean JSON responses

export const uploadProfileImage = (req, res, next) => {
    upload.single("profileImage")(req, res, (err) => {
        if (!err) return next()
        if (err instanceof multer.MulterError) {
            const messages = {
                LIMIT_FILE_SIZE: "File size exceeds the maximum limit of 5MB.",
                LIMIT_FILE_COUNT: "Only one file is allowed.",
                LIMIT_UNEXPECTED_FILE: "Unexpected file field. Only one file is allowed.",
            };
            const message = messages[err.code] || "File upload error.";
            return errorResponse(res, 400, message, err.code);
        }
        return errorResponse(res, 500, err.message, err.code);
    })
}

