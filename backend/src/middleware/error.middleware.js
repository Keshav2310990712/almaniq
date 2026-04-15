export function notFoundHandler(_req, res) {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error"
  });
}
