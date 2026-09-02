import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
     const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ errorCode: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); 
        req.user = decoded
        next();
    } catch (error) {
        return res.status(403).json({ errorCode: "FORBIDDEN", message: "Forbidden" });
    }
}