const Order = require("../model/Order");
const Product = require("../model/Product");
const User = require("../model/User");

const getAdminStats = async (req, res, next) => {
  // Use aggregate for revenue to avoid loading all orders into memory
  const [totalOrders, totalProducts, totalUsers, revenueResult] = await Promise.all([
    Order.countDocuments({}),
    Product.countDocuments({ deletedAt: { $exists: false } }),
    User.countDocuments({ role: "user" }),
    Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  res.json({ totalOrders, totalProducts, totalUsers, totalRevenue });
};

module.exports = { getAdminStats };
