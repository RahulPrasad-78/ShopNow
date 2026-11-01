const Order = require("../model/Order");
const { AppError } = require("../utils/AppError");

// Order creation lives in paymentController.createOrder, which prices the cart
// server-side. The addOrderItems handler that used to be here trusted the
// client's totalAmount and paymentId outright and has been removed.

const getMyOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ userId: req.user._id }),
  ]);

  res.json({ orders, page, pages: Math.ceil(total / limit), total });
};

const getOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({})
      .populate("userId", "id name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({}),
  ]);

  res.json({ orders, page, pages: Math.ceil(total / limit), total });
};

const updateOrderStatus = async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError("Order not found", 404));

  order.status = req.body.status;
  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

module.exports = { getMyOrders, getOrders, updateOrderStatus };
