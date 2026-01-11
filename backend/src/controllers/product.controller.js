const Product = require("../models/Product.model");

// ADMIN: Create product
const createProduct = async (req, res) => {
  const { name, description, price, unit, imageUrl } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    unit,
    imageUrl,
  });

  res.status(201).json({ message: "Product created", product });
};

// PUBLIC / USER / SHOP: Get products
const getProducts = async (req, res) => {
  const products = await Product.find({ isAvailable: true }).sort({
    createdAt: -1,
  });
  res.json({ products });
};

// ADMIN: Update product
const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json({ message: "Product updated", product });
};

// ADMIN: Soft delete
const deleteProduct = async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isAvailable: false });
  res.json({ message: "Product disabled" });
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
