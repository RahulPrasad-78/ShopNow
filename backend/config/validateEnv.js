const fs = require("fs");
const path = require("path");

/**
 * Validates environment variables on startup.
 * Ensures critical configurations are present before booting up the server or database.
 */
const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("FATAL ERROR: Missing required environment variable(s):", missing.join(", "));
    console.error("Please configure them in your .env file or environment.");
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }

  // Warn about payment and media variables if missing in production
  if (process.env.NODE_ENV === "production") {
    const recommended = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "EMAIL_USER",
      "EMAIL_PASS",
    ];
    const missingRecommended = recommended.filter((key) => !process.env[key]);
    if (missingRecommended.length > 0) {
      console.warn("WARNING: The following recommended production variables are not configured:", missingRecommended.join(", "));
    }
  }

  // Ensure JWT_SECRET is strong
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16 && process.env.NODE_ENV === "production") {
    console.warn("SECURITY WARNING: JWT_SECRET is shorter than 16 characters! Use a strong, random 32+ character key.");
  }
};

module.exports = { validateEnv };
