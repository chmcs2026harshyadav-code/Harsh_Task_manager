const routeNotFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // multer errors (file too big etc.)
  if (err.name === "MulterError" || /Only image files/.test(message)) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") message = "Each image must be under 5 MB.";
  }

  res.status(statusCode).json({
    status: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { routeNotFound, errorHandler };
