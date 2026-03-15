# Notification Model Verification

## Task: 2.6 Create Notification model with schema validation

### Requirements from Design Document

The Notification model should have:

1. **Required Fields**:
   - `userId`: ObjectId reference to User (required)
   - `type`: String enum ['ORDER', 'EVENT', 'SHOP_REQUEST', 'STOCK', 'SYSTEM'] (required)
   - `message`: String (required)

2. **Optional Fields with Defaults**:
   - `priority`: String enum ['HIGH', 'MEDIUM', 'LOW'] (default: 'MEDIUM')
   - `isRead`: Boolean (default: false)
   - `metadata`: Object with optional relatedId and relatedType

3. **Timestamps**:
   - `createdAt`: Date (auto-generated)
   - `updatedAt`: Date (auto-generated)

4. **Indexes**:
   - Single index on `userId`
   - Single index on `isRead`
   - Single index on `priority`
   - Compound index on `(userId, isRead, priority, createdAt)`

### Implementation Status: ✅ COMPLETE

### Test Results

All 39 tests passed successfully:

#### 1. Valid Notification Creation (3 tests)
- ✅ Creates notification with all required fields
- ✅ Creates notification with default values (priority: MEDIUM, isRead: false)
- ✅ Creates notification without metadata

#### 2. Required Field Validation (3 tests)
- ✅ Fails without userId
- ✅ Fails without type
- ✅ Fails without message

#### 3. Type Enum Validation (7 tests)
- ✅ Accepts valid type: ORDER
- ✅ Accepts valid type: EVENT
- ✅ Accepts valid type: SHOP_REQUEST
- ✅ Accepts valid type: STOCK
- ✅ Accepts valid type: SYSTEM
- ✅ Fails with invalid type

#### 4. Priority Enum Validation (5 tests)
- ✅ Accepts valid priority: HIGH
- ✅ Accepts valid priority: MEDIUM
- ✅ Accepts valid priority: LOW
- ✅ Defaults to MEDIUM priority
- ✅ Fails with invalid priority

#### 5. IsRead Boolean Field (3 tests)
- ✅ Defaults isRead to false
- ✅ Allows setting isRead to true
- ✅ Allows setting isRead to false explicitly

#### 6. Metadata Field Validation (7 tests)
- ✅ Accepts metadata with relatedId and relatedType
- ✅ Accepts metadata with relatedType: EventRequest
- ✅ Accepts metadata with relatedType: ShopRequest
- ✅ Accepts metadata with relatedType: Product
- ✅ Fails with invalid relatedType
- ✅ Accepts metadata with only relatedId
- ✅ Accepts empty metadata object

#### 7. Timestamps (1 test)
- ✅ Has createdAt and updatedAt fields

#### 8. Schema Indexes (4 tests)
- ✅ Has index on userId field
- ✅ Has index on isRead field
- ✅ Has index on priority field
- ✅ Has compound index on (userId, isRead, priority, createdAt)

#### 9. ObjectId Reference Validation (2 tests)
- ✅ Accepts valid ObjectId for userId
- ✅ Accepts valid ObjectId for metadata.relatedId

#### 10. Notification Type Scenarios (5 tests)
- ✅ Creates ORDER notification with high priority
- ✅ Creates EVENT notification with medium priority
- ✅ Creates SHOP_REQUEST notification
- ✅ Creates STOCK notification with high priority
- ✅ Creates SYSTEM notification with low priority

### Schema Validation Coverage

| Requirement | Implementation | Test Coverage |
|------------|----------------|---------------|
| userId (required, ObjectId ref) | ✅ | ✅ |
| type (required, enum) | ✅ | ✅ |
| message (required, String) | ✅ | ✅ |
| priority (enum, default: MEDIUM) | ✅ | ✅ |
| isRead (Boolean, default: false) | ✅ | ✅ |
| metadata.relatedId (ObjectId) | ✅ | ✅ |
| metadata.relatedType (enum) | ✅ | ✅ |
| createdAt timestamp | ✅ | ✅ |
| updatedAt timestamp | ✅ | ✅ |
| userId index | ✅ | ✅ |
| isRead index | ✅ | ✅ |
| priority index | ✅ | ✅ |
| Compound index | ✅ | ✅ |

### Index Verification

The model includes all required indexes:

1. **Single Indexes**:
   - `userId: 1` - For user-specific notification queries
   - `isRead: 1` - For filtering unread notifications
   - `priority: 1` - For priority sorting

2. **Compound Index**:
   - `{ userId: 1, isRead: 1, priority: -1, createdAt: -1 }` - Optimizes the most common query pattern: getting a user's notifications sorted by priority and date

### Use Cases Supported

The Notification model supports all required notification scenarios:

1. **ORDER Notifications**: Daily shop orders placed
2. **EVENT Notifications**: Event/catering requests
3. **SHOP_REQUEST Notifications**: Shop partnership applications
4. **STOCK Notifications**: Low stock alerts
5. **SYSTEM Notifications**: General system messages

### Priority Levels

- **HIGH**: Daily orders, low stock alerts (urgent)
- **MEDIUM**: Event orders, shop requests (normal)
- **LOW**: General updates, system messages (informational)

### Metadata Linking

The metadata field allows notifications to link to related entities:
- Orders (relatedType: 'Order')
- Event Requests (relatedType: 'EventRequest')
- Shop Requests (relatedType: 'ShopRequest')
- Products (relatedType: 'Product')

This enables the frontend to navigate directly to the related entity when a notification is clicked.

### Performance Considerations

The compound index `(userId, isRead, priority, createdAt)` is optimized for the most common query pattern:
```javascript
Notification.find({ 
  userId: userId, 
  isRead: false 
})
.sort({ priority: -1, createdAt: -1 })
```

This query will be used frequently in:
- Admin dashboard (recent notifications)
- User notification dropdown
- Notification page with filters

### Conclusion

✅ **Task 2.6 is COMPLETE**

The Notification model has been successfully implemented with:
- All required fields and validation
- Proper enum constraints for type and priority
- Default values for priority and isRead
- Flexible metadata structure for entity linking
- Comprehensive indexes for query optimization
- Full test coverage (39 tests, all passing)

The model is ready for use in the notification system implementation.
