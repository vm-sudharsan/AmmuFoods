/**
 * EventRequest Model Tests
 * 
 * Tests for the EventRequest model schema validation and functionality
 * Task: 2.4 Create EventRequest model with schema validation
 */

const mongoose = require("mongoose");
const EventRequest = require("../EventRequest.model");

describe("EventRequest Model Tests", () => {
  // Helper to create valid ObjectIds
  const createObjectId = () => new mongoose.Types.ObjectId();
  
  // Sample test data
  const testUserId = createObjectId();
  const testProductId1 = createObjectId();
  const testProductId2 = createObjectId();
  const testAdminId = createObjectId();

  describe("Schema Validation", () => {
    test("should create event request with all required fields", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        secondaryContact: "9876543211",
        eventLocation: "123 Party Street, Test City",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            approximateQuantity: 50,
          },
          {
            productId: testProductId2,
            productName: "Sweet Beeda",
            approximateQuantity: 30,
          },
        ],
        specialInstructions: "Please deliver early",
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.userId.toString()).toBe(testUserId.toString());
      expect(eventRequest.userName).toBe("John Doe");
      expect(eventRequest.userEmail).toBe("john@example.com");
      expect(eventRequest.eventName).toBe("Birthday Party");
      expect(eventRequest.contactPerson).toBe("John Doe");
      expect(eventRequest.contactNumber).toBe("9876543210");
      expect(eventRequest.secondaryContact).toBe("9876543211");
      expect(eventRequest.eventLocation).toBe("123 Party Street, Test City");
      expect(eventRequest.eventDate).toEqual(futureDate);
      expect(eventRequest.eventTime).toBe("6:00 PM");
      expect(eventRequest.deliveryTime).toBe("5:00 PM");
      expect(eventRequest.products).toHaveLength(2);
      expect(eventRequest.specialInstructions).toBe("Please deliver early");
      expect(eventRequest.status).toBe("NEW");
    });

    test("should fail without required userId", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.userId.kind).toBe("required");
    });

    test("should fail without required userName", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userName).toBeDefined();
    });

    test("should fail without required userEmail", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userEmail).toBeDefined();
    });

    test("should fail without required eventName", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.eventName).toBeDefined();
    });

    test("should fail without required contactPerson", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.contactPerson).toBeDefined();
    });

    test("should fail without required contactNumber", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.contactNumber).toBeDefined();
    });

    test("should fail without required eventLocation", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.eventLocation).toBeDefined();
    });

    test("should fail without required eventDate", () => {
      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.eventDate).toBeDefined();
    });

    test("should fail without required eventTime", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.eventTime).toBeDefined();
    });

    test("should fail without required deliveryTime", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.deliveryTime).toBeDefined();
    });

    test("should fail with invalid status", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
        status: "INVALID_STATUS",
      });

      const error = eventRequest.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });
  });

  describe("Status Enum", () => {
    test("should accept all valid status values", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const validStatuses = ["NEW", "CONTACTED", "ACCEPTED", "REJECTED", "COMPLETED"];

      for (const status of validStatuses) {
        const eventRequest = new EventRequest({
          userId: testUserId,
          userName: "John Doe",
          userEmail: "john@example.com",
          eventName: "Birthday Party",
          contactPerson: "John Doe",
          contactNumber: "9876543210",
          eventLocation: "123 Party Street",
          eventDate: futureDate,
          eventTime: "6:00 PM",
          deliveryTime: "5:00 PM",
          products: [],
          status,
        });

        const error = eventRequest.validateSync();
        expect(error).toBeUndefined();
        expect(eventRequest.status).toBe(status);
      }
    });

    test("should default to NEW status", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      expect(eventRequest.status).toBe("NEW");
    });
  });

  describe("Products Array", () => {
    test("should store multiple products correctly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            approximateQuantity: 50,
          },
          {
            productId: testProductId2,
            productName: "Sweet Beeda",
            approximateQuantity: 30,
          },
        ],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.products).toHaveLength(2);
      expect(eventRequest.products[0].productId.toString()).toBe(testProductId1.toString());
      expect(eventRequest.products[0].productName).toBe("Ellaneer Payasam");
      expect(eventRequest.products[0].approximateQuantity).toBe(50);
      expect(eventRequest.products[1].productId.toString()).toBe(testProductId2.toString());
      expect(eventRequest.products[1].productName).toBe("Sweet Beeda");
      expect(eventRequest.products[1].approximateQuantity).toBe(30);
    });

    test("should allow empty products array", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.products).toHaveLength(0);
    });
  });

  describe("Status History", () => {
    test("should allow adding status history entries", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      // Add status history entry
      eventRequest.statusHistory.push({
        status: "CONTACTED",
        timestamp: new Date(),
        updatedBy: testAdminId,
        notes: "Called customer to confirm details",
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.statusHistory).toHaveLength(1);
      expect(eventRequest.statusHistory[0].status).toBe("CONTACTED");
      expect(eventRequest.statusHistory[0].updatedBy.toString()).toBe(testAdminId.toString());
      expect(eventRequest.statusHistory[0].timestamp).toBeDefined();
      expect(eventRequest.statusHistory[0].notes).toBe("Called customer to confirm details");
    });

    test("should track multiple status changes", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      // Add multiple status history entries
      const statuses = [
        { status: "CONTACTED", notes: "Initial contact" },
        { status: "ACCEPTED", notes: "Order confirmed" },
        { status: "COMPLETED", notes: "Delivered successfully" },
      ];
      
      for (const statusEntry of statuses) {
        eventRequest.statusHistory.push({
          status: statusEntry.status,
          timestamp: new Date(),
          updatedBy: testAdminId,
          notes: statusEntry.notes,
        });
      }

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.statusHistory).toHaveLength(3);
      expect(eventRequest.statusHistory[0].status).toBe("CONTACTED");
      expect(eventRequest.statusHistory[2].status).toBe("COMPLETED");
    });
  });

  describe("Indexes", () => {
    test("should have index on userId", async () => {
      const indexes = EventRequest.schema.indexes();
      const userIdIndex = indexes.find((idx) => idx[0].userId === 1);
      expect(userIdIndex).toBeDefined();
    });

    test("should have index on status", async () => {
      const indexes = EventRequest.schema.indexes();
      const statusIndex = indexes.find((idx) => idx[0].status === 1);
      expect(statusIndex).toBeDefined();
    });

    test("should have index on eventDate", async () => {
      const indexes = EventRequest.schema.indexes();
      const eventDateIndex = indexes.find((idx) => idx[0].eventDate === 1);
      expect(eventDateIndex).toBeDefined();
    });

    test("should have compound index on status and eventDate", async () => {
      const indexes = EventRequest.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) => idx[0].status === 1 && idx[0].eventDate === 1
      );
      expect(compoundIndex).toBeDefined();
    });

    test("should have compound index on userId and createdAt", async () => {
      const indexes = EventRequest.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) => idx[0].userId === 1 && idx[0].createdAt === -1
      );
      expect(compoundIndex).toBeDefined();
    });

    test("should have compound index on eventDate and status", async () => {
      const indexes = EventRequest.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) => idx[0].eventDate === 1 && idx[0].status === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe("Optional Fields", () => {
    test("should allow event request without secondaryContact", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.secondaryContact).toBeUndefined();
    });

    test("should allow event request without specialInstructions", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.specialInstructions).toBeUndefined();
    });

    test("should allow event request without adminNotes", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.adminNotes).toBeUndefined();
    });

    test("should store secondaryContact when provided", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        secondaryContact: "9876543211",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.secondaryContact).toBe("9876543211");
    });

    test("should store specialInstructions when provided", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
        specialInstructions: "Please deliver early",
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.specialInstructions).toBe("Please deliver early");
    });

    test("should store adminNotes when provided", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: futureDate,
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
        adminNotes: "VIP customer",
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.adminNotes).toBe("VIP customer");
    });
  });

  describe("Timestamps", () => {
    test("should have createdAt and updatedAt fields defined in schema", () => {
      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: new Date(),
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      // Timestamps are added when saving, but the schema should have them defined
      expect(eventRequest.schema.paths.createdAt).toBeDefined();
      expect(eventRequest.schema.paths.updatedAt).toBeDefined();
    });
  });

  describe("References", () => {
    test("should have userId reference to User model", () => {
      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: new Date(),
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [],
      });

      expect(eventRequest.userId).toBeDefined();
      expect(eventRequest.userId.toString()).toBe(testUserId.toString());
    });

    test("should have productId references in products array", () => {
      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "John Doe",
        userEmail: "john@example.com",
        eventName: "Birthday Party",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        eventLocation: "123 Party Street",
        eventDate: new Date(),
        eventTime: "6:00 PM",
        deliveryTime: "5:00 PM",
        products: [
          {
            productId: testProductId1,
            productName: "Ellaneer Payasam",
            approximateQuantity: 50,
          },
        ],
      });

      expect(eventRequest.products[0].productId).toBeDefined();
      expect(eventRequest.products[0].productId.toString()).toBe(testProductId1.toString());
    });
  });

  describe("String Trimming", () => {
    test("should trim whitespace from string fields", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventRequest = new EventRequest({
        userId: testUserId,
        userName: "  John Doe  ",
        userEmail: "  john@example.com  ",
        eventName: "  Birthday Party  ",
        contactPerson: "  John Doe  ",
        contactNumber: "  9876543210  ",
        secondaryContact: "  9876543211  ",
        eventLocation: "  123 Party Street  ",
        eventDate: futureDate,
        eventTime: "  6:00 PM  ",
        deliveryTime: "  5:00 PM  ",
        products: [],
        specialInstructions: "  Please deliver early  ",
        adminNotes: "  VIP customer  ",
      });

      const error = eventRequest.validateSync();
      expect(error).toBeUndefined();
      expect(eventRequest.eventName).toBe("Birthday Party");
      expect(eventRequest.contactPerson).toBe("John Doe");
      expect(eventRequest.contactNumber).toBe("9876543210");
      expect(eventRequest.secondaryContact).toBe("9876543211");
      expect(eventRequest.eventLocation).toBe("123 Party Street");
      expect(eventRequest.eventTime).toBe("6:00 PM");
      expect(eventRequest.deliveryTime).toBe("5:00 PM");
      expect(eventRequest.specialInstructions).toBe("Please deliver early");
      expect(eventRequest.adminNotes).toBe("VIP customer");
    });
  });
});
