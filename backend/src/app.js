const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();


const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");


const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

const productRoutes = require("./routes/product.routes");

const shopRoutes = require("./routes/shop.routes");
app.use("/shop", shopRoutes);

app.use("/products", productRoutes);


app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


app.use(cookieParser());
app.use("/auth", authRoutes);


app.get('/health',(req,res)=> {
    res.status(200).json({
        status:"ok",
        message: "AmmuFoods Backend is running ",
    });
});

module.exports=app;
