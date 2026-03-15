/**
 * Order Model Tests
 * 
 * Tests for the Order model schema validation and functionality
 * Task: 2.3 Create Order model with schema validation
 */

const mongoose = require("mongoose");
const Order = require("../Order.model");

describe("Order Model Tests", () => {
  // Helper to create valid ObjectIds
  const createObjectId = () => new mongoose.Types.ObjectId();
  
  // Sample test data
  const testShopId = createObjectId();
  const testProductId1 = createObjectId();
  const testProductId2 = createObjectId();
  const testAdminId = createObjectId();

  describe("Schema Validation", () => {
    test("should create order with all required fields", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            quantity: 10,
            pricePerUnit: 150,
            totalPrice: 1500,
          },
          {
            productId: testProductId2,
            productName: "Sweet Beeda",
            quantity: 5,
            pricePerUnit: 100,
            totalPrice: 500,
          },
        ],
        totalAmount: 2000,
        deliveryAddress: "123 Test Street, Test City",
        contactNumber: "9876543210",
        preferredDeliveryTime: "10:00 AM",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.shopId.toString()).toBe(testShopId.toString());
      expect(order.shopName).toBe("Test Shop");
      expect(order.deliveryDate).toEqual(tomorrow);
      expect(order.products).toHaveLength(2);
      expect(order.totalAmount).toBe(2000);
      expect(order.status).toBe("PLACED");
      expect(order.deliveryAddress).toBe("123 Test Street, Test City");
      expect(order.contactNumber).toBe("9876543210");
      expect(order.preferredDeliveryTime).toBe("10:00 AM");
    });

    test("should fail without required shopId", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.shopId).toBeDefined();
      expect(error.errors.shopId.kind).toBe("required");
    });

    test("should fail without required shopName", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.shopName).toBeDefined();
    });

    test("should fail without required deliveryDate", () => {
      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.deliveryDate).toBeDefined();
    });

    test("should fail without required deliveryAddress", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.deliveryAddress).toBeDefined();
    });

    test("should fail without required contactNumber", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.contactNumber).toBeDefined();
    });

    test("should fail with invalid status", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
        status: "INVALID_STATUS",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test("should fail with product quantity less than 1", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            quantity: 0, // Invalid: less than 1
            pricePerUnit: 150,
            totalPrice: 0,
          },
        ],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors["products.0.quantity"]).toBeDefined();
    });
  });

  describe("Status Enum", () => {
    test("should accept all valid status values", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const validStatuses = ["PLACED", "APPROVED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

      for (const status of validStatuses) {
        const order = new Order({
          shopId: testShopId,
          shopName: "Test Shop",
          deliveryDate: tomorrow,
          products: [],
          totalAmount: 0,
          deliveryAddress: "123 Test Street",
          contactNumber: "9876543210",
          status,
        });

        const error = order.validateSync();
        expect(error).toBeUndefined();
        expect(order.status).toBe(status);
      }
    });

    test("should default to PLACED status", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      expect(order.status).toBe("PLACED");
    });
  });

  describe("Products Array", () => {
    test("should store multiple products correctly", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            quantity: 10,
            pricePerUnit: 150,
            totalPrice: 1500,
          },
          {
            productId: testProductId2,
            productName: "Sweet Beeda",
            quantity: 5,
            pricePerUnit: 100,
            totalPrice: 500,
          },
        ],
        totalAmount: 2000,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.products).toHaveLength(2);
      expect(order.products[0].productId.toString()).toBe(testProductId1.toString());
      expect(order.products[0].productName).toBe("Ellaneer Payasam");
      expect(order.products[0].quantity).toBe(10);
      expect(order.products[0].pricePerUnit).toBe(150);
      expect(order.products[0].totalPrice).toBe(1500);
      expect(order.products[1].productId.toString()).toBe(testProductId2.toString());
      expect(order.products[1].productName).toBe("Sweet Beeda");
      expect(order.products[1].quantity).toBe(5);
      expect(order.products[1].pricePerUnit).toBe(100);
      expect(order.products[1].totalPrice).toBe(500);
    });

    test("should allow empty products array", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.products).toHaveLength(0);
    });
  });

  describe("Status History", () => {
    test("should allow adding status history entries", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      // Add status history entry
      order.statusHistory.push({
        status: "APPROVED",
        timestamp: new Date(),
        updatedBy: testAdminId,
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.statusHistory).toHaveLength(1);
      expect(order.statusHistory[0].status).toBe("APPROVED");
      expect(order.statusHistory[0].updatedBy.toString()).toBe(testAdminId.toString());
      expect(order.statusHistory[0].timestamp).toBeDefined();
    });

    test("should track multiple status changes", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      // Add multiple status history entries
      const statuses = ["APPROVED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
      for (const status of statuses) {
        order.statusHistory.push({
          status,
          timestamp: new Date(),
          updatedBy: testAdminId,
        });
      }

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.statusHistory).toHaveLength(4);
      expect(order.statusHistory[0].status).toBe("APPROVED");
      expect(order.statusHistory[3].status).toBe("DELIVERED");
    });
  });

  describe("Indexes", () => {
    test("should have index on shopId", async () => {
      const indexes = Order.schema.indexes();
      const shopIdIndex = indexes.find((idx) => idx[0].shopId === 1);
      expect(shopIdIndex).toBeDefined();
    });

    test("should have index on deliveryDate", async () => {
      const indexes = Order.schema.indexes();
      const deliveryDateIndex = indexes.find((idx) => idx[0].deliveryDate === 1);
      expect(deliveryDateIndex).toBeDefined();
    });

    test("should have index on status", async () => {
      const indexes = Order.schema.indexes();
      const statusIndex = indexes.find((idx) => idx[0].status === 1);
      expect(statusIndex).toBeDefined();
    });

    test("should have compound index on deliveryDate and status", async () => {
      const indexes = Order.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) => idx[0].deliveryDate === 1 && idx[0].status === 1
      );
      expect(compoundIndex).toBeDefined();
    });

    test("should have compound index on shopId and createdAt", async () => {
      const indexes = Order.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) => idx[0].shopId === 1 && idx[0].createdAt === -1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe("Optional Fields", () => {
    test("should allow order without preferredDeliveryTime", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.preferredDeliveryTime).toBeUndefined();
    });

    test("should allow order without adminNotes", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.adminNotes).toBeUndefined();
    });

    test("should store preferredDeliveryTime when provided", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
        preferredDeliveryTime: "2:00 PM",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.preferredDeliveryTime).toBe("2:00 PM");
    });

    test("should store adminNotes when provided", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: tomorrow,
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
        adminNotes: "Handle with care",
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
      expect(order.adminNotes).toBe("Handle with care");
    });
  });

  describe("Timestamps", () => {
    test("should have createdAt and updatedAt fields defined in schema", () => {
      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: new Date(),
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      // Timestamps are added when saving, but the schema should have them defined
      expect(order.schema.paths.createdAt).toBeDefined();
      expect(order.schema.paths.updatedAt).toBeDefined();
    });
  });

  describe("References", () => {
    test("should have shopId reference to User model", () => {
      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: new Date(),
        products: [],
        totalAmount: 0,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      expect(order.shopId).toBeDefined();
      expect(order.shopId.toString()).toBe(testShopId.toString());
    });

    test("should have productId references in products array", () => {
      const order = new Order({
        shopId: testShopId,
        shopName: "Test Shop",
        deliveryDate: new Date(),
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            quantity: 10,
            pricePerUnit: 150,
            totalPrice: 1500,
          },
        ],
        totalAmount: 1500,
        deliveryAddress: "123 Test Street",
        contactNumber: "9876543210",
      });

      expect(order.products[0].productId).toBeDefined();
      expect(order.products[0].productId.toString()).toBe(testProductId1.toString());
    });
  });
});
