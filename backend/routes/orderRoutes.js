const express = require("express");
const {
  getMyOrders,
  getOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { validate } = require("../middleware/validate");
const { updateOrderStatusRules, paginationRules } = require("../middleware/validators");

const router = express.Router();

// Orders are created only by POST /api/payment/order, which prices the cart
// from the database and records the gateway order id. There is deliberately no
// POST here: the old one accepted a client-supplied totalAmount and paymentId,
// so any logged-in user could mint a completed order for any price they liked.
router.route("/").get(protect, admin, paginationRules, validate, getOrders);
router.route("/myorders").get(protect, paginationRules, validate, getMyOrders);
router.route("/:id/status").put(protect, admin, updateOrderStatusRules, validate, updateOrderStatus);

module.exports = router;
