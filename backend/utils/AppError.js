/**
 * An expected, operational failure - something the caller did wrong, or a
 * business rule that was violated. Distinguished from a genuine bug so the
 * error handler knows whether the message is safe to send to the client.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code) {
    super(message);
    this.statusCode = statusCode;
    // Machine-readable reason the client can branch on (e.g. EMAIL_NOT_VERIFIED).
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
