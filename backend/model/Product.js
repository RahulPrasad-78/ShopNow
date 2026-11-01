const mongoose = require("mongoose");

const productShema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"],
  },
  imageUrl: {
    type: String,
    required: true,
  },
  // Needed to clean up the CDN asset when a product is updated or deleted.
  cloudinaryPublicId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
});

productShema.index({ category: 1, price: 1 });
productShema.index({ name: "text", description: "text" });

const Product = mongoose.model("Product", productShema);
module.exports = Product;
