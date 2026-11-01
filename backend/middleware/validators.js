const { body, query, param } = require("express-validator");

// ── Auth ──────────────────────────────────────────────────────────────────────
const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 100 }).withMessage("Name must be 100 chars or less"),
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("accountType")
    .optional()
    .isIn(["user", "test"]).withMessage("Invalid account type"),
];

const loginRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

const verifyEmailRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("otp")
    .trim()
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
    .isNumeric().withMessage("OTP must be exactly 6 digits"),
];

const resendOtpRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
];

// ── Products ──────────────────────────────────────────────────────────────────
const createProductRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Product name is required")
    .isLength({ max: 200 }).withMessage("Name must be 200 chars or less"),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("category")
    .trim()
    .notEmpty().withMessage("Category is required"),
  body("stock")
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
];

const updateProductRules = [
  param("_id").isMongoId().withMessage("Invalid product ID"),
  body("name").optional().trim().isLength({ max: 200 }).withMessage("Name must be 200 chars or less"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be non-negative"),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be non-negative"),
];

// ── Orders ────────────────────────────────────────────────────────────────────
const updateOrderStatusRules = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("status")
    .trim()
    .notEmpty().withMessage("Status is required")
    .isIn(["Pending", "Shipped", "Delivered", "Cancelled"]).withMessage("Invalid status value"),
];

// ── Pagination (shared) ───────────────────────────────────────────────────────
const paginationRules = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100")
    .toInt(),
];

module.exports = {
  registerRules,
  loginRules,
  verifyEmailRules,
  createProductRules,
  updateProductRules,
  updateOrderStatusRules,
  paginationRules,
  resendOtpRules,
};
