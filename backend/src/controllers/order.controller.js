const Order = require("../models/Order.model");
const { createShopOrder } = require("../services/order.service");

// SHOP: Place daily order
const placeOrder = async (req, res) => {
  try {
    const order = await createShopOrder({
      shopUserId: req.user._id,
      items: req.body.items,
      deliveryDate: req.body.deliveryDate,
    });

    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// SHOP: Order history
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ shopUserId: req.user._id })
    .populate("items.productId", "name unit")
    .sort({ createdAt: -1 });

  res.json({ orders });
};

// ADMIN: Get all orders
const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("shopUserId", "name email")
    .populate("items.productId", "name unit")
    .sort({ createdAt: -1 });

  res.json({ orders });
};

module.exports = { placeOrder, getMyOrders, getAllOrders };

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json({ message: "Order status updated", order });
};

module.exports.updateOrderStatus = updateOrderStatus;
