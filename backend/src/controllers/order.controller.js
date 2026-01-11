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

module.exports = { placeOrder, getMyOrders };
