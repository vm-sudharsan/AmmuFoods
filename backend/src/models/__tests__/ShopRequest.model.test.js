const mongoose = require("mongoose");
const ShopRequest = require("../ShopRequest.model");

describe("ShopRequest Model", () => {
  describe("Schema Validation", () => {
    it("should create a valid shop request with all required fields", () => {
      const validShopRequest = new ShopRequest({
        userId: new mongoose.Types.ObjectId(),
        userName: "John Doe",
        userEmail: "john@example.com",
        shopName: "John's Grocery Store",
        shopOwnerName: "John Doe",
        businessDetails: "GST: 29ABCDE1234F1Z5",
        shopAddress: "123 Main Street, City",
        area: "Downtown",
        contactNumber: "9876543210",
        alternateContact: "9876543211",
        dailyStockNeeded: "50 units of various products",
        preferredDeliveryTime: "8:00 AM",
        productsInterested: [new mongoose.Types.ObjectId()],
        additionalNotes: "Please deliver early",
        status: "PENDING",
      });

      const error = validShopRequest.validateSync();
      expect(error).toBeUndefined();
    });

    it("should fail validation when required fields are missing", () => {
      const invalidShopRequest = new ShopRequest({
        userName: "John Doe",
        // Missing required fields
      });

      const error = invalidShopRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.userEmail).toBeDefined();
      expect(error.errors.shopName).toBeDefined();
      expect(error.errors.shopOwnerName).toBeDefined();
      expect(error.errors.shopAddress).toBeDefined();
      expect(error.errors.area).toBeDefined();
      expect(error.errors.contactNumber).toBeDefined();
      expect(error.errors.dailyStockNeeded).toBeDefined();
    });

    it("should have default status as PENDING", () => {
      const shopRequest = new ShopRequest({
        userId: new mongoose.Types.ObjectId(),
        userName: "John Doe",
        userEmail: "john@example.com",
        shopName: "John's Grocery Store",
        shopOwnerName: "John Doe",
        shopAddress: "123 Main Street",
        area: "Downtown",
        contactNumber: "9876543210",
        dailyStockNeeded: "50 units",
      });

      expect(shopRequest.status).toBe("PENDING");
    });

    it("should only accept valid status values", () => {
      const shopRequest = new ShopRequest({
        userId: new mongoose.Types.ObjectId(),
        userName: "John Doe",
        userEmail: "john@example.com",
        shopName: "John's Grocery Store",
        shopOwnerName: "John Doe",
        shopAddress: "123 Main Street",
        area: "Downtown",
        contactNumber: "9876543210",
        dailyStockNeeded: "50 units",
        status: "INVALID_STATUS",
      });

      const error = shopRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    it("should accept PENDING, APPROVED, and REJECTED status values", () => {
      const statuses = ["PENDING", "APPROVED", "REJECTED"];

      statuses.forEach((status) => {
        const shopRequest = new ShopRequest({
          userId: new mongoose.Types.ObjectId(),
          userName: "John Doe",
          userEmail: "john@example.com",
          shopName: "John's Grocery Store",
          shopOwnerName: "John Doe",
          shopAddress: "123 Main Street",
          area: "Downtown",
          contactNumber: "9876543210",
          dailyStockNeeded: "50 units",
          status: status,
        });

        const error = shopRequest.validateSync();
        expect(error).toBeUndefined();
        expect(shopRequest.status).toBe(status);
      });
    });

    it("should allow optional fields to be undefined", () => {
      const shopRequest = new ShopRequest({
        userId: new mongoose.Types.ObjectId(),
        userName: "John Doe",
        userEmail: "john@example.com",
        shopName: "John's Grocery Store",
        shopOwnerName: "John Doe",
        shopAddress: "123 Main Street",
        area: "Downtown",
        contactNumber: "9876543210",
        dailyStockNeeded: "50 units",
        // Optional fields not provided
      });

      const error = shopRequest.validateSync();
      expect(error).toBeUndefined();
      expect(shopRequest.businessDetails).toBeUndefined();
      expect(shopRequest.alternateContact).toBeUndefined();
      expect(shopRequest.preferredDeliveryTime).toBeUndefined();
      expect(shopRequest.additionalNotes).toBeUndefined();
      expect(shopRequest.adminNotes).toBeUndefined();
      expect(shopRequest.rejectionReason).toBeUndefined();
    });

    it("should trim string fields", () => {
      const shopRequest = new ShopRequest({
        userId: new mongoose.Types.ObjectId(),
        userName: "  John Doe  ",
        userEmail: "  john@example.com  ",
        shopName: "  John's Grocery Store  ",
        shopOwnerName: "  John Doe  ",
        shopAddress: "  123 Main Street  ",
        area: "  Downtown  ",
        contactNumber: "  9876543210  ",
        dailyStockNeeded: "  50 units  ",
      });

      expect(shopRequest.userName).toBe("  John Doe  "); // userName is not trimmed in schema
      expect(shopRequest.shopName).toBe("John's Grocery Store");
      expect(shopRequest.shopOwnerName).toBe("John Doe");
      expect(shopRequest.shopAddress).toBe("123 Main Street");
      expect(shopRequest.area).toBe("Downtown");
      expect(shopRequest.contactNumber).toBe("9876543210");
      expect(shopRequest.dailyStockNeeded).toBe("50 units");
    });

    it("should have timestamps enabled", () => {
      const shopRequest = new ShopRequest({
        userId: new mongoose.Types.ObjectId(),
        userName: "John Doe",
        userEmail: "john@example.com",
        shopName: "John's Grocery Store",
        shopOwnerName: "John Doe",
        shopAddress: "123 Main Street",
        area: "Downtown",
        contactNumber: "9876543210",
        dailyStockNeeded: "50 units",
      });

      // Timestamps are only set when document is saved, not on instantiation
      // Check that the schema has timestamps enabled
      expect(ShopRequest.schema.options.timestamps).toBe(true);
    });
  });

  describe("Indexes", () => {
    it("should have index on userId", () => {
      const indexes = ShopRequest.schema.indexes();
      const userIdIndex = indexes.find(
        (index) => index[0].userId !== undefined
      );
      expect(userIdIndex).toBeDefined();
    });

    it("should have index on status", () => {
      const indexes = ShopRequest.schema.indexes();
      const statusIndex = indexes.find(
        (index) => index[0].status !== undefined
      );
      expect(statusIndex).toBeDefined();
    });

    it("should have compound index on userId and status", () => {
      const indexes = ShopRequest.schema.indexes();
      const compoundIndex = indexes.find(
        (index) => index[0].userId !== undefined && index[0].status !== undefined
      );
      expect(compoundIndex).toBeDefined();
      expect(compoundIndex[0]).toEqual({ userId: 1, status: 1 });
    });
  });

  describe("References", () => {
    it("should reference User model for userId", () => {
      const userIdPath = ShopRequest.schema.path("userId");
      expect(userIdPath.options.ref).toBe("User");
    });

    it("should reference User model for reviewedBy", () => {
      const reviewedByPath = ShopRequest.schema.path("reviewedBy");
      expect(reviewedByPath.options.ref).toBe("User");
    });

    it("should reference Product model for productsInterested", () => {
      const productsInterestedPath = ShopRequest.schema.path(
        "productsInterested"
      );
      // For array of ObjectIds, the ref is in the options.type array
      expect(productsInterestedPath.options.type[0].ref).toBe("Product");
    });
  });
});
