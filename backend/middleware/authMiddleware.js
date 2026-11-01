const jwt = require("jsonwebtoken");
const User = require("../model/User");
const { AppError } = require("../utils/AppError");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Not authorized, no token", 401));
  }

  const token = header.split(" ")[1];
  if (!token) {
    return next(new AppError("Not authorized, no token", 401));
  }

  // jwt.verify throws JsonWebTokenError / TokenExpiredError — both are caught
  // by the central error handler, which maps them to 401 with a safe message.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");

  // A token can outlive the account it was issued for. Without this check
  // req.user is null and every controller that reads req.user._id throws.
  if (!user) {
    return next(new AppError("Not authorized, user not found", 401));
  }

  // Login already refuses unverified accounts; this also covers any token
  // issued before verification was required.
  if (!user.verified) {
    return next(
      new AppError("Please verify your email first", 403, "EMAIL_NOT_VERIFIED"),
    );
  }

  req.user = user;
  return next();
};

module.exports = { protect };
