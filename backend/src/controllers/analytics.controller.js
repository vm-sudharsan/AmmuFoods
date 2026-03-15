const { getSalesAnalytics } = require("../services/analytics.service");

const getAnalytics = async (req, res) => {
  const { range } = req.query;

  const analytics = await getSalesAnalytics(range || "DAILY");

  res.json({ analytics });
};

module.exports = { getAnalytics };
