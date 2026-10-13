import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      errorCode: "UNAUTHORIZED",
      message: "Authentication required. Please provide a valid access token.",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        errorCode: "TOKEN_EXPIRED",
        message: "Access token has expired. Please refresh your session.",
      });
    }

    return res.status(401).json({
      errorCode: "INVALID_TOKEN",
      message: "Invalid access token.",
    });
  }
};
