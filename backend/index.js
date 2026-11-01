const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { validateEnv } = require("./config/validateEnv");
const { sanitizeBody } = require("./middleware/sanitize");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// 1. Environment initialization & validation
dotenv.config();
validateEnv();

// 2. Database. A normal server connects once at boot (below); on Vercel each
// request awaits the cached connection instead (see the middleware further down).
if (!process.env.VERCEL) connectDB();

const app = express();

// Trust reverse proxy (Render, Heroku, Nginx) for accurate client IPs in rate limiters
app.set("trust proxy", 1);

// 3. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 4. CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://127.0.0.1:3000",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// 5. Body Parsing & NoSQL Injection Sanitization
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitizeBody);

// 6. Rate Limiters
// General API rate limiter: 300 requests per 15 minutes per IP
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
});

// Stricter rate limiter for authentication routes: 20 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." },
});

// 7. API Routes
// Serverless: make sure the DB is connected before any route runs.
if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      next(error);
    }
  });
}

app.use("/api", generalApiLimiter);
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// Healthcheck route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 8. Catch unmatched /api/* before static file fallback
app.use("/api", notFound);

// 9. Serve frontend in production
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("ShopNow API is running in Development mode...");
  });
}

// 10. Central Error Handler (must be registered last)
app.use(errorHandler);

// Local / traditional hosting: start the server. On Vercel the exported app is
// wrapped by api/index.js and Vercel handles listening.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
