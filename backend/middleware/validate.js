const { validationResult } = require("express-validator");
const { AppError } = require("../utils/AppError");

/**
 * Runs express-validator checks attached to the route and short-circuits
 * with a 400 AppError if any fail.
 *
 * Usage:
 *   router.post("/path", [body("field").notEmpty()], validate, handler)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    return next(new AppError(message, 400));
  }
  next();
};

module.exports = { validate };
