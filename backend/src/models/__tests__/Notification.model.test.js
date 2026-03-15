/**
 * Notification Model Tests
 * 
 * Tests for the Notification model schema validation and functionality
 * Task: 2.6 Create Notification model with schema validation
 */

const mongoose = require('mongoose');
const Notification = require('../Notification.model');

describe('Notification Model Tests', () => {
  // Test 1: Valid notification creation
  describe('Valid Notification Creation', () => {
    it('should create a notification with all required fields', () => {
      const validNotification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'New order placed for tomorrow',
        priority: 'HIGH',
        isRead: false,
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'Order'
        }
      });

      const error = validNotification.validateSync();
      expect(error).toBeUndefined();
      expect(validNotification.type).toBe('ORDER');
      expect(validNotification.priority).toBe('HIGH');
      expect(validNotification.isRead).toBe(false);
    });

    it('should create a notification with default values', () => {
      const notificationWithDefaults = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'EVENT',
        message: 'New event request received'
      });

      const error = notificationWithDefaults.validateSync();
      expect(error).toBeUndefined();
      expect(notificationWithDefaults.priority).toBe('MEDIUM');
      expect(notificationWithDefaults.isRead).toBe(false);
    });

    it('should create a notification without metadata', () => {
      const minimalNotification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SYSTEM',
        message: 'System maintenance scheduled'
      });

      const error = minimalNotification.validateSync();
      expect(error).toBeUndefined();
      expect(minimalNotification.metadata).toBeDefined();
      expect(minimalNotification.metadata.relatedId).toBeUndefined();
    });
  });

  // Test 2: Required field validation
  describe('Required Field Validation', () => {
    it('should fail without userId', () => {
      const notificationWithoutUserId = new Notification({
        type: 'ORDER',
        message: 'Test message'
      });

      const error = notificationWithoutUserId.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.userId.kind).toBe('required');
    });

    it('should fail without type', () => {
      const notificationWithoutType = new Notification({
        userId: new mongoose.Types.ObjectId(),
        message: 'Test message'
      });

      const error = notificationWithoutType.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    it('should fail without message', () => {
      const notificationWithoutMessage = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER'
      });

      const error = notificationWithoutMessage.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.message).toBeDefined();
    });
  });

  // Test 3: Enum validation for type
  describe('Type Enum Validation', () => {
    it('should accept valid type: ORDER', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Order notification'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept valid type: EVENT', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'EVENT',
        message: 'Event notification'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept valid type: SHOP_REQUEST', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SHOP_REQUEST',
        message: 'Shop request notification'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept valid type: STOCK', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'STOCK',
        message: 'Low stock alert'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept valid type: SYSTEM', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SYSTEM',
        message: 'System notification'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });

    it('should fail with invalid type', () => {
      const notificationWithInvalidType = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'INVALID_TYPE',
        message: 'Test message'
      });

      const error = notificationWithInvalidType.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });
  });

  // Test 4: Enum validation for priority
  describe('Priority Enum Validation', () => {
    it('should accept valid priority: HIGH', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Urgent order',
        priority: 'HIGH'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.priority).toBe('HIGH');
    });

    it('should accept valid priority: MEDIUM', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'EVENT',
        message: 'Event request',
        priority: 'MEDIUM'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.priority).toBe('MEDIUM');
    });

    it('should accept valid priority: LOW', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SYSTEM',
        message: 'System update',
        priority: 'LOW'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.priority).toBe('LOW');
    });

    it('should default to MEDIUM priority', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message'
      });

      expect(notification.priority).toBe('MEDIUM');
    });

    it('should fail with invalid priority', () => {
      const notificationWithInvalidPriority = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message',
        priority: 'CRITICAL'
      });

      const error = notificationWithInvalidPriority.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.priority).toBeDefined();
    });
  });

  // Test 5: Boolean field validation
  describe('IsRead Boolean Field', () => {
    it('should default isRead to false', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message'
      });

      expect(notification.isRead).toBe(false);
    });

    it('should allow setting isRead to true', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message',
        isRead: true
      });

      expect(notification.isRead).toBe(true);
    });

    it('should allow setting isRead to false explicitly', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message',
        isRead: false
      });

      expect(notification.isRead).toBe(false);
    });
  });

  // Test 6: Metadata validation
  describe('Metadata Field Validation', () => {
    it('should accept metadata with relatedId and relatedType', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Order placed',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'Order'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.metadata.relatedId).toBeDefined();
      expect(notification.metadata.relatedType).toBe('Order');
    });

    it('should accept metadata with relatedType: EventRequest', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'EVENT',
        message: 'Event request received',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'EventRequest'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.metadata.relatedType).toBe('EventRequest');
    });

    it('should accept metadata with relatedType: ShopRequest', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SHOP_REQUEST',
        message: 'Shop request submitted',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'ShopRequest'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.metadata.relatedType).toBe('ShopRequest');
    });

    it('should accept metadata with relatedType: Product', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'STOCK',
        message: 'Low stock alert',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'Product'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.metadata.relatedType).toBe('Product');
    });

    it('should fail with invalid relatedType', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'InvalidType'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['metadata.relatedType']).toBeDefined();
    });

    it('should accept metadata with only relatedId', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message',
        metadata: {
          relatedId: new mongoose.Types.ObjectId()
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept empty metadata object', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SYSTEM',
        message: 'System message',
        metadata: {}
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
    });
  });

  // Test 7: Timestamps
  describe('Timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message'
      });

      // Timestamps are added when saving, but the schema should have them defined
      expect(notification.schema.paths.createdAt).toBeDefined();
      expect(notification.schema.paths.updatedAt).toBeDefined();
    });
  });

  // Test 8: Indexes
  describe('Schema Indexes', () => {
    it('should have index on userId field', () => {
      const indexes = Notification.schema.indexes();
      const userIdIndex = indexes.find(idx => idx[0].userId === 1);
      expect(userIdIndex).toBeDefined();
    });

    it('should have index on isRead field', () => {
      const indexes = Notification.schema.indexes();
      const isReadIndex = indexes.find(idx => idx[0].isRead === 1);
      expect(isReadIndex).toBeDefined();
    });

    it('should have index on priority field', () => {
      const indexes = Notification.schema.indexes();
      const priorityIndex = indexes.find(idx => idx[0].priority === 1);
      expect(priorityIndex).toBeDefined();
    });

    it('should have compound index on userId, isRead, priority, and createdAt', () => {
      const indexes = Notification.schema.indexes();
      const compoundIndex = indexes.find(idx => 
        idx[0].userId === 1 && 
        idx[0].isRead === 1 && 
        idx[0].priority === -1 && 
        idx[0].createdAt === -1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  // Test 9: ObjectId reference validation
  describe('ObjectId Reference Validation', () => {
    it('should accept valid ObjectId for userId', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.userId).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should accept valid ObjectId for metadata.relatedId', () => {
      const relatedId = new mongoose.Types.ObjectId();
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'Test message',
        metadata: {
          relatedId: relatedId,
          relatedType: 'Order'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.metadata.relatedId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(notification.metadata.relatedId.toString()).toBe(relatedId.toString());
    });
  });

  // Test 10: Different notification type scenarios
  describe('Notification Type Scenarios', () => {
    it('should create ORDER notification with high priority', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'ORDER',
        message: 'New daily order placed by Shop ABC',
        priority: 'HIGH',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'Order'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.type).toBe('ORDER');
      expect(notification.priority).toBe('HIGH');
    });

    it('should create EVENT notification with medium priority', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'EVENT',
        message: 'New event request for wedding catering',
        priority: 'MEDIUM',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'EventRequest'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.type).toBe('EVENT');
      expect(notification.priority).toBe('MEDIUM');
    });

    it('should create SHOP_REQUEST notification', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SHOP_REQUEST',
        message: 'New shop partnership request received',
        priority: 'MEDIUM',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'ShopRequest'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.type).toBe('SHOP_REQUEST');
    });

    it('should create STOCK notification with high priority', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'STOCK',
        message: 'Low stock alert: Ellaneer Payasam below minimum level',
        priority: 'HIGH',
        metadata: {
          relatedId: new mongoose.Types.ObjectId(),
          relatedType: 'Product'
        }
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.type).toBe('STOCK');
      expect(notification.priority).toBe('HIGH');
    });

    it('should create SYSTEM notification with low priority', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'SYSTEM',
        message: 'System maintenance scheduled for tonight',
        priority: 'LOW'
      });

      const error = notification.validateSync();
      expect(error).toBeUndefined();
      expect(notification.type).toBe('SYSTEM');
      expect(notification.priority).toBe('LOW');
    });
  });
});
