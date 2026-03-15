const Order = require("../models/Order.model");

const isTomorrow = (date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return new Date(date).toDateString() === tomorrow.toDateString();
};

const createShopOrder = async ({ shopUserId, items, deliveryDate }) => {
  if (!isTomorrow(deliveryDate)) {
    throw new Error("Delivery date must be tomorrow only");
  }

  return Order.create({
    shopUserId,
    items,
    deliveryDate,
  });
};

module.exports = { createShopOrder };
