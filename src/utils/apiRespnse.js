export const errorResponse = (res, status, message, errorCode = null) => {
    return res.status(status).json({
        success: false,
        message,
        ...(errorCode && { errorCode })
    });
};

export const arrayResponse = (res, status, message, data = []) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
};


export const emptyArrayResponse = (res, status, message = "No data found") => {
    return res.status(status).json({
        success: true,
        message,
        data: []
    });
};


export const objectResponse = (res, status, message, data = {}) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
};

export const successResponse = (res, status, message, data = null) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
};