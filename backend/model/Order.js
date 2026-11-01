const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        // Snapshots taken at purchase time so history survives catalogue
        // edits and product deletion.
        name: { type: String },
        imageUrl: { type: String },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    address: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    // Set by Razorpay order creation, before any money moves.
    razorpayOrderId: { type: String },
    // Set only after a signature has been verified server-side. Unique so a
    // single payment can never be replayed into multiple orders.
    paymentId: { type: String, unique: true, sparse: true },
    paymentStatus: {
      type: String,
      enum: ["Created", "Paid", "Failed", "Refunded"],
      default: "Created",
    },
    // How the order was paid for - "razorpay" is the real gateway,
    // "sandbox" is the no-gateway demo path.
    paymentMethod: {
      type: String,
      enum: ["razorpay", "sandbox"],
      default: "razorpay",
    },
    stockApplied: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
