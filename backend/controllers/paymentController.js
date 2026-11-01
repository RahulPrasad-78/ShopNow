const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../model/Order");
const { AppError } = require("../utils/AppError");
const { priceCart, applyStock, restoreStock } = require("../utils/pricing");
const { sendEmailSafe } = require("../utils/sendEmail");
const { orderConfirmationEmail } = require("../utils/emailTemplates");

const paymentsConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const requiredAddress = ["fullName", "street", "city", "postalCode", "country"];

const validateAddress = (address) => {
  if (!address || typeof address !== "object") {
    throw new AppError("Shipping address is required", 400);
  }
  for (const field of requiredAddress) {
    if (!address[field] || typeof address[field] !== "string") {
      throw new AppError(`Address field "${field}" is required`, 400);
    }
  }
  return requiredAddress.reduce(
    (acc, f) => ({ ...acc, [f]: String(address[f]).trim().slice(0, 200) }),
    {},
  );
};

/**
 * Creates a Razorpay order AND a local Pending order in one step.
 *
 * The amount is computed here from database prices - the request body only
 * carries { items: [{ productId, qty }], address }. A tampered price or total
 * in the payload is ignored entirely.
 */
const createOrder = async (req, res, next) => {
  if (!paymentsConfigured()) {
    return next(new AppError("Payments are not configured on this server", 503));
  }

  const address = validateAddress(req.body.address);
  const { items, totalAmount } = await priceCart(req.body.items);

  let rzpOrder;
  try {
    rzpOrder = await getInstance().orders.create({
      amount: Math.round(totalAmount * 100), // paise, integer
      currency: "INR",
      receipt: `rcpt_${req.user._id}_${Date.now()}`,
      notes: { userId: String(req.user._id) },
    });
  } catch (error) {
    // Razorpay's own status codes must not be re-used as ours. Bad API keys
    // come back as a 401, which the browser would otherwise read as "your
    // session expired" and bounce a perfectly logged-in shopper to /login.
    const detail = error?.error?.description || error.message;
    console.error("[razorpay] order creation failed:", detail);
    return next(
      new AppError(`Payment gateway error: ${detail}`, 502),
    );
  }

  if (!rzpOrder) {
    return next(new AppError("Could not create payment order", 502));
  }

  // Persist the intended order now, so a payment can always be reconciled
  // back to something even if the browser dies mid-flow.
  const order = await Order.create({
    userId: req.user._id,
    items,
    totalAmount,
    currency: "INR",
    address,
    razorpayOrderId: rzpOrder.id,
    paymentStatus: "Created",
    paymentMethod: "razorpay",
  });

  res.json({
    id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key_id: process.env.RAZORPAY_KEY_ID,
    orderId: order._id,
  });
};

/**
 * Verifies the gateway signature and finalises the order in the same request.
 *
 * Verification and persistence used to be separate calls, which meant a
 * verified payment could be replayed into many orders, or an order could be
 * created with a completely made-up paymentId.
 */
const verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return next(new AppError("Incomplete payment confirmation", 400));
  }

  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time compare: === short-circuits on the first differing char and
  // leaks how much of the signature matched.
  const a = Buffer.from(expectedSign, "hex");
  const b = Buffer.from(razorpay_signature, "hex");
  const signatureValid =
    a.length === b.length && crypto.timingSafeEqual(a, b);

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    return next(new AppError("Unknown payment order", 404));
  }
  // The authenticated caller must own the order they are confirming.
  if (String(order.userId) !== String(req.user._id)) {
    return next(new AppError("Not authorized for this order", 403));
  }

  if (!signatureValid) {
    order.paymentStatus = "Failed";
    await order.save();
    return next(new AppError("Invalid signature sent!", 400));
  }

  // Idempotent: a retried or double-submitted confirmation returns the same
  // order instead of decrementing stock twice.
  if (order.paymentStatus === "Paid") {
    return res.status(200).json({
      message: "Payment already verified",
      order,
    });
  }

  await applyStock(order.items);

  try {
    order.paymentId = razorpay_payment_id;
    order.paymentStatus = "Paid";
    order.stockApplied = true;
    await order.save();
  } catch (error) {
    await restoreStock(order.items);
    throw error;
  }

  sendEmailSafe(
    req.user.email,
    "ShopNow - Order Confirmation",
    orderConfirmationEmail(order, req.user.name),
  );

  res.status(200).json({ message: "Payment verified successfully", order });
};

module.exports = { createOrder, verifyPayment };
