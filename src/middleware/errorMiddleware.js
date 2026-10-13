export const notFound = (res, req) => {
  res.status(404).json({
    errorCode: "ROUTE_NOT_FOUND",
    message: `Route ${req.originalUrl} not found`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    errorCode: err.errorCode || "INTERNAL_SERVER_ERROR",
    message: err.message || "Internal server error",
  });
};
