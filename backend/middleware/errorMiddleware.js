/**
 * Unmatched /api/* paths. Without this they fall through to the SPA fallback
 * and return HTML with a 200, which the client then fails to JSON.parse.
 */
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Single terminal error handler.
 *
 * Express 5 forwards rejected promises from async handlers here automatically,
 * so controllers no longer need their own try/catch just to return a 500.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  // Malformed ObjectId in a path param - the caller's fault, not ours.
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose schema validation - surface the field messages, not the raw dump.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Rejected upload - too large, too many files, or the wrong type. The
  // caller needs to know which, so these must not collapse into a bare 500.
  if (err.name === "MulterError") {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller"
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Only one image may be uploaded"
          : `Upload rejected: ${err.message}`;
  }

  // Duplicate key on a unique index (e.g. a replayed paymentId).
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `Duplicate ${field}`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Not authorized, token failed";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired, please log in again";
  }

  // Log everything server-side; only send the detail out when it is a known
  // operational error. Unexpected errors get a generic message so internal
  // schema and driver details are not leaked to a probing client.
  console.error(`[${statusCode}] ${req.method} ${req.originalUrl} -`, err);

  const safeMessage =
    statusCode >= 500 && !err.isOperational ? "Server error" : message;

  res.status(statusCode).json({
    message: safeMessage,
    ...(err.isOperational && typeof err.code === "string" && { code: err.code }),
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
