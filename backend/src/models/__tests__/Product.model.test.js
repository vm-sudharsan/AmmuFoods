/**
 * Product Model Tests
 * 
 * Tests for the Product model schema validation and functionality
 * Task: 2.2 Create Product model with schema validation
 */

const mongoose = require('mongoose');
const Product = require('../Product.model');

describe('Product Model Tests', () => {
  // Test 1: Valid product creation
  describe('Valid Product Creation', () => {
    it('should create a product with all required fields', () => {
      const validProduct = new Product({
        name: 'Ellaneer Payasam',
        description: 'Traditional tender coconut pudding',
        category: 'Desserts',
        unit: 'liters',
        pricePerUnit: 150,
        currentStock: 50,
        minimumStockLevel: 10,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        imagePublicId: 'sample_id',
        isAvailable: true
      });

      // Validate the product
      const error = validProduct.validateSync();
      expect(error).toBeUndefined();
      expect(validProduct.name).toBe('Ellaneer Payasam');
      expect(validProduct.pricePerUnit).toBe(150);
      expect(validProduct.isAvailable).toBe(true);
    });

    it('should create a product with default values', () => {
      const productWithDefaults = new Product({
        name: 'Sweet Beeda',
        description: 'Traditional sweet betel leaf preparation',
        unit: 'pieces',
        pricePerUnit: 10
      });

      const error = productWithDefaults.validateSync();
      expect(error).toBeUndefined();
      expect(productWithDefaults.currentStock).toBe(0);
      expect(productWithDefaults.minimumStockLevel).toBe(10);
      expect(productWithDefaults.isAvailable).toBe(true);
    });

    it('should create a product without optional fields', () => {
      const minimalProduct = new Product({
        name: 'Jigarthanda',
        description: 'Refreshing traditional drink',
        unit: 'bottles',
        pricePerUnit: 50
      });

      const error = minimalProduct.validateSync();
      expect(error).toBeUndefined();
      expect(minimalProduct.category).toBeUndefined();
      expect(minimalProduct.imageUrl).toBeUndefined();
    });
  });

  // Test 2: Required field validation
  describe('Required Field Validation', () => {
    it('should fail without name', () => {
      const productWithoutName = new Product({
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100
      });

      const error = productWithoutName.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.kind).toBe('required');
    });

    it('should fail without description', () => {
      const productWithoutDescription = new Product({
        name: 'Test Product',
        unit: 'kg',
        pricePerUnit: 100
      });

      const error = productWithoutDescription.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    it('should fail without unit', () => {
      const productWithoutUnit = new Product({
        name: 'Test Product',
        description: 'Test description',
        pricePerUnit: 100
      });

      const error = productWithoutUnit.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.unit).toBeDefined();
    });

    it('should fail without pricePerUnit', () => {
      const productWithoutPrice = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg'
      });

      const error = productWithoutPrice.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.pricePerUnit).toBeDefined();
    });
  });

  // Test 3: Numeric field validation
  describe('Numeric Field Validation', () => {
    it('should fail with negative pricePerUnit', () => {
      const productWithNegativePrice = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: -10
      });

      const error = productWithNegativePrice.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.pricePerUnit).toBeDefined();
    });

    it('should fail with negative currentStock', () => {
      const productWithNegativeStock = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100,
        currentStock: -5
      });

      const error = productWithNegativeStock.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.currentStock).toBeDefined();
    });

    it('should fail with negative minimumStockLevel', () => {
      const productWithNegativeMinStock = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100,
        minimumStockLevel: -5
      });

      const error = productWithNegativeMinStock.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.minimumStockLevel).toBeDefined();
    });

    it('should accept zero values for numeric fields', () => {
      const productWithZeroValues = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 0,
        currentStock: 0,
        minimumStockLevel: 0
      });

      const error = productWithZeroValues.validateSync();
      expect(error).toBeUndefined();
    });
  });

  // Test 4: String trimming
  describe('String Trimming', () => {
    it('should trim whitespace from name', () => {
      const product = new Product({
        name: '  Ellaneer Payasam  ',
        description: 'Test description',
        unit: 'liters',
        pricePerUnit: 100
      });

      expect(product.name).toBe('Ellaneer Payasam');
    });

    it('should trim whitespace from category', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        category: '  Desserts  ',
        unit: 'kg',
        pricePerUnit: 100
      });

      expect(product.category).toBe('Desserts');
    });

    it('should trim whitespace from unit', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: '  kg  ',
        pricePerUnit: 100
      });

      expect(product.unit).toBe('kg');
    });
  });

  // Test 5: Timestamps
  describe('Timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100
      });

      // Timestamps are added when saving, but the schema should have them defined
      expect(product.schema.paths.createdAt).toBeDefined();
      expect(product.schema.paths.updatedAt).toBeDefined();
    });
  });

  // Test 6: Indexes
  describe('Schema Indexes', () => {
    it('should have index on name field', () => {
      const indexes = Product.schema.indexes();
      const nameIndex = indexes.find(idx => idx[0].name === 1);
      expect(nameIndex).toBeDefined();
    });

    it('should have index on category field', () => {
      const indexes = Product.schema.indexes();
      const categoryIndex = indexes.find(idx => idx[0].category === 1);
      expect(categoryIndex).toBeDefined();
    });

    it('should have index on isAvailable field', () => {
      const indexes = Product.schema.indexes();
      const isAvailableIndex = indexes.find(idx => idx[0].isAvailable === 1);
      expect(isAvailableIndex).toBeDefined();
    });

    it('should have text index on name and description', () => {
      const indexes = Product.schema.indexes();
      const textIndex = indexes.find(idx => idx[0].name === 'text' && idx[0].description === 'text');
      expect(textIndex).toBeDefined();
    });

    it('should have compound index on isAvailable and createdAt', () => {
      const indexes = Product.schema.indexes();
      const compoundIndex = indexes.find(idx => 
        idx[0].isAvailable === 1 && idx[0].createdAt === -1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have compound index on category and isAvailable', () => {
      const indexes = Product.schema.indexes();
      const compoundIndex = indexes.find(idx => 
        idx[0].category === 1 && idx[0].isAvailable === 1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have index on currentStock for low stock alerts', () => {
      const indexes = Product.schema.indexes();
      const stockIndex = indexes.find(idx => idx[0].currentStock === 1);
      expect(stockIndex).toBeDefined();
    });
  });

  // Test 7: Boolean default values
  describe('Boolean Default Values', () => {
    it('should default isAvailable to true', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100
      });

      expect(product.isAvailable).toBe(true);
    });

    it('should allow setting isAvailable to false', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100,
        isAvailable: false
      });

      expect(product.isAvailable).toBe(false);
    });
  });

  // Test 8: Cloudinary fields
  describe('Cloudinary Image Fields', () => {
    it('should accept imageUrl and imagePublicId', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
        imagePublicId: 'sample_public_id'
      });

      const error = product.validateSync();
      expect(error).toBeUndefined();
      expect(product.imageUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg');
      expect(product.imagePublicId).toBe('sample_public_id');
    });

    it('should work without image fields', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        unit: 'kg',
        pricePerUnit: 100
      });

      const error = product.validateSync();
      expect(error).toBeUndefined();
      expect(product.imageUrl).toBeUndefined();
      expect(product.imagePublicId).toBeUndefined();
    });
  });
});
