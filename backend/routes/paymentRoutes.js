const express = require("express");
const {
  createOrder,
  verifyPayment,
} = require("../controllers/paymentController.js");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Both handlers read req.user - to stamp the order's owner on creation, and to
// check that owner again on confirmation. Without `protect` they threw a
// TypeError on every call, and an unauthenticated caller could confirm
// somebody else's payment.
router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
