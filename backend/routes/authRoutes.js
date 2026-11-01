const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  resendOtp,
  getMe,
  getAllUsers,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { validate } = require("../middleware/validate");
const {
  registerRules,
  loginRules,
  verifyEmailRules,
  resendOtpRules,
  paginationRules,
} = require("../middleware/validators");

router.post("/register", registerRules, validate, registerUser);
router.post("/login", loginRules, validate, loginUser);
router.post("/verify-email", verifyEmailRules, validate, verifyEmail);
router.post("/resend-otp", resendOtpRules, validate, resendOtp);

// The signed-in user's own profile.
router.get("/me", protect, getMe);

// Admin-only user directory. "/user" is the path the admin UI already calls;
// "/users" is the name that actually describes a collection.
router.get("/user", protect, admin, paginationRules, validate, getAllUsers);
router.get("/users", protect, admin, paginationRules, validate, getAllUsers);

module.exports = router;
