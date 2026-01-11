const Order = require("../models/Order.model");

const getDateRange = (type) => {
  const now = new Date();
  let start;

  switch (type) {
    case "DAILY":
      start = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "WEEKLY":
      start = new Date(now.setDate(now.getDate() - 6));
      break;
    case "MONTHLY":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "YEARLY":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      throw new Error("Invalid range type");
  }

  return { start, end: new Date() };
};

const getSalesAnalytics = async (rangeType) => {
  const { start, end } = getDateRange(rangeType);

  const data = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  return data;
};

module.exports = { getSalesAnalytics };
