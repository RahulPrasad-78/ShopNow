const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();
router
  .route("/")
  .get(getAllProducts)
  .post(protect, admin, upload.single("image"), createProduct);
router
  .route("/:_id")
  .get(getProductById)
  .put(protect, admin, upload.single("image"), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
