const express = require("express");

const morgan = require("morgan");

const app = express();


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

const helmet = require("helmet");
const cors = require("cors");

app.use(
  cors({
    origin: ["http://localhost:3000"], // frontend dev URL
    credentials: true, // allow cookies
  })
);

app.use(helmet());

app.use(apiLimiter);


app.use(errorHandler);

app.use("/analytics", analyticsRoutes);

app.use("/events", eventRoutes);

app.use("/shop", shopRoutes);

app.use("/products", productRoutes);


app.use("/users", userRoutes);
app.use("/admin", adminRoutes);


app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}


app.use(cookieParser());
app.use("/auth", authRoutes);


app.get('/health',(req,res)=> {
    res.status(200).json({
        status:"ok",
        message: "AmmuFoods Backend is running ",
    });
});

module.exports=app;
