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
const { AppError } = require("../utils/AppError");
const { validate } = require("../middleware/validate");
const {
  createProductRules,
  updateProductRules,
  paginationRules,
} = require("../middleware/validators");
const { param } = require("express-validator");

// The controller deletes the temp file after uploading it to Cloudinary, but
// multer writes to disk before the controller runs at all - so the cap and the
// type check belong here, not there.
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new AppError("Only image uploads are allowed (jpeg, png, webp, gif, avif)", 400));
  },
});

const router = express.Router();
router
  .route("/")
  .get(paginationRules, validate, getAllProducts)
  .post(protect, admin, upload.single("image"), createProductRules, validate, createProduct);

router
  .route("/:_id")
  .get([param("_id").isMongoId().withMessage("Invalid product ID")], validate, getProductById)
  .put(protect, admin, upload.single("image"), updateProductRules, validate, updateProduct)
  .delete(protect, admin, [param("_id").isMongoId().withMessage("Invalid product ID")], validate, deleteProduct);

module.exports = router;
