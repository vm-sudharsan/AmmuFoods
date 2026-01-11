const Order = require("../models/Order.model");
const { getTomorrowRange } = require("../utils/date.util");

const getTomorrowManufacturingData = async () => {
  const { start, end } = getTomorrowRange();

  // Fetch tomorrow orders
  const orders = await Order.find({
    deliveryDate: { $gte: start, $lte: end },
    status: { $in: ["PLACED", "APPROVED"] },
  }).populate("items.productId", "name unit");

  // Product-wise totals
  const productTotals = {};

  // Shop-wise packing
  const shopPacking = [];

  orders.forEach((order) => {
    const shopItems = [];

    order.items.forEach((item) => {
      const productId = item.productId._id.toString();

      if (!productTotals[productId]) {
        productTotals[productId] = {
          productId,
          name: item.productId.name,
          unit: item.productId.unit,
          totalQuantity: 0,
        };
      }

      productTotals[productId].totalQuantity += item.quantity;

      shopItems.push({
        productName: item.productId.name,
        quantity: item.quantity,
        unit: item.productId.unit,
      });
    });

    shopPacking.push({
      shopUserId: order.shopUserId,
      orderId: order._id,
      items: shopItems,
    });
  });

  return {
    productTotals: Object.values(productTotals),
    shopPacking,
  };
};

module.exports = { getTomorrowManufacturingData };
