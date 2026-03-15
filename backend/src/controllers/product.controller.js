const Product = require("../models/Product.model");
const { uploadImage, deleteImage } = require("../services/cloudinary.service");
const { notifyAdmins } = require("../services/notification.service");

/**
 * ADMIN: Create product with image upload
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      unit,
      pricePerUnit,
      currentStock,
      minimumStockLevel,
      image, // Base64 image
    } = req.body;

    // Validate required fields
    if (!name || !description || !unit || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let imageUrl = null;
    let imagePublicId = null;

    // Upload image to Cloudinary if provided
    if (image) {
      try {
        const uploadResult = await uploadImage(image, "ammufoods/products");
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Failed to upload image",
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      unit,
      pricePerUnit: Number(pricePerUnit),
      currentStock: Number(currentStock) || 0,
      minimumStockLevel: Number(minimumStockLevel) || 10,
      imageUrl,
      imagePublicId,
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

/**
 * PUBLIC: Get all available products
 * ADMIN: Get all products including unavailable
 */
const getProducts = async (req, res) => {
  try {
    const { category, search, available } = req.query;
    const isAdmin = req.user && req.user.role === "ADMIN";

    // Build query
    const query = {};

    // Non-admin users only see available products
    if (!isAdmin || available === "true") {
      query.isAvailable = true;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

/**
 * PUBLIC: Get single product
 */
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

/**
 * ADMIN: Update product
 */
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      unit,
      pricePerUnit,
      currentStock,
      minimumStockLevel,
      isAvailable,
      image, // New image (base64)
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle image update
    if (image) {
      try {
        // Delete old image if exists
        if (product.imagePublicId) {
          await deleteImage(product.imagePublicId);
        }

        // Upload new image
        const uploadResult = await uploadImage(image, "ammufoods/products");
        product.imageUrl = uploadResult.url;
        product.imagePublicId = uploadResult.publicId;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Failed to upload new image",
        });
      }
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category !== undefined) product.category = category;
    if (unit) product.unit = unit;
    if (pricePerUnit !== undefined) product.pricePerUnit = Number(pricePerUnit);
    if (currentStock !== undefined) product.currentStock = Number(currentStock);
    if (minimumStockLevel !== undefined)
      product.minimumStockLevel = Number(minimumStockLevel);
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

/**
 * ADMIN: Soft delete product
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product disabled successfully",
      product,
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

/**
 * ADMIN: Get low stock products
 */
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isAvailable: true,
      $expr: { $lt: ["$currentStock", "$minimumStockLevel"] },
    }).sort({ currentStock: 1 });

    // Create notifications for low stock items
    if (products.length > 0) {
      await notifyAdmins(
        "STOCK",
        `${products.length} product(s) are running low on stock`,
        "HIGH",
        {
          relatedType: "Product",
          count: products.length,
        }
      );
    }

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get low stock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock products",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
