const cloudinary = require("../config/cloudinary");
const Product = require("../model/Product");
const { AppError } = require("../utils/AppError");
const fs = require("fs");

/** Safely remove a temp file left by multer — errors are non-fatal. */
const cleanTemp = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
  }
};

// Get all Products (with pagination & optional search/category filter)
const getAllProducts = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$text = { $search: req.query.search };
  // Soft-delete: never return deleted products to clients
  filter.deletedAt = { $exists: false };

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

// Get Product By ID
const getProductById = async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params._id,
    deletedAt: { $exists: false },
  });
  if (!product) return next(new AppError("Product not found", 404));
  res.json(product);
};

// Create Product
const createProduct = async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  let imageUrl = "";
  let cloudinaryPublicId = "";

  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "shopnow" });
      imageUrl = result.secure_url;
      cloudinaryPublicId = result.public_id;
    } finally {
      cleanTemp(req.file.path);
    }
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    stock,
    imageUrl,
    cloudinaryPublicId,
  });

  res.status(201).json(product);
};

// Update Product
const updateProduct = async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params._id,
    deletedAt: { $exists: false },
  });

  if (!product) {
    cleanTemp(req.file?.path);
    return next(new AppError("Product not found", 404));
  }

  const { name, description, price, category, stock } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;

  if (req.file) {
    try {
      // Delete old Cloudinary asset when replacing image
      if (product.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(product.cloudinaryPublicId).catch(() => {});
      }
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "shopnow" });
      product.imageUrl = result.secure_url;
      product.cloudinaryPublicId = result.public_id;
    } finally {
      cleanTemp(req.file.path);
    }
  }

  const updatedProduct = await product.save();
  res.json(updatedProduct);
};

// Soft Delete Product — sets deletedAt instead of removing the document,
// so order history that references this product remains intact.
const deleteProduct = async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params._id,
    deletedAt: { $exists: false },
  });
  if (!product) return next(new AppError("Product not found", 404));

  product.deletedAt = new Date();
  await product.save();

  res.json({ message: "Product deleted successfully" });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
