const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const productRoutes = require("./routes/product.routes");
const shopRoutes = require("./routes/shop.routes");
const eventRoutes = require("./routes/event.routes");
const analyticsRoutes = require("./routes/analytics.routes");

const errorHandler = require("./middlewares/error.middleware");
const apiLimiter = require("./middlewares/rateLimit.middleware");

const app = express();

// ============================================
// MIDDLEWARE - ORDER MATTERS!
// ============================================

// 1. Security & CORS (before any request processing)
app.use(helmet());

// CORS Configuration - supports both development and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // Production URL from env
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies
  })
);

// 2. Rate limiting (before routes)
app.use(apiLimiter);

// 3. Body parsing (MUST be before routes)
app.use(express.json({ limit: "10mb" })); // Increased for image uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Cookie parsing (before auth routes)
app.use(cookieParser());

// 5. Logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ============================================
// ROUTES
// ============================================


// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AmmuFoods Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/products", productRoutes);
app.use("/shop", shopRoutes);
app.use("/events", eventRoutes);
app.use("/analytics", analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ============================================
// ERROR HANDLER (MUST BE LAST)
// ============================================
app.use(errorHandler);

module.exports = app;
