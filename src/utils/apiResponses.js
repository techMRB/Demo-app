export const validationError = (error) => {
    const fieldNameMapping = {
        user_email: "User email"
    };

    if (error.code === 11000) {
        // Handle duplicate key error
        const duplicateField = Object.keys(error.keyValue)[0];
        const userFriendlyField = fieldNameMapping[duplicateField] || duplicateField;
        return { [userFriendlyField]: `${userFriendlyField} already exists. Please use a different ${userFriendlyField}` };
    }

    if (error.errors) {
        // Get the first error key
        const firstKey = Object.keys(error.errors)[0];
        return { [firstKey]: error.errors[firstKey].message };
    }

    return { general: "An unexpected validation error occurred." };
};

export const errorResponse = (res, status, message) => {
    if (typeof message === "object") {
        return res.status(status).json({ errors: message });
    }
    return res.status(status).json({ error: message });
};

export const arrayResponse = (res, status, data) => {
    return res.status(status).json({ status, data });
};

export const emptyArrayResponse = (res, status, message) => {
    return res.status(status).json({ status, message, data: [] });
};

export const objectResponse = (res, status, data) => {
    return res.status(status).json({ status, data });
};

export const successResponse = (res, status, message, data = null) => {
    return res.status(status).json({ message, data });
};

