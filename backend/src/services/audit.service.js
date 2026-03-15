const AuditLog = require("../models/AuditLog.model");

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {ObjectId} params.userId - User who performed the action
 * @param {String} params.action - Action performed
 * @param {String} params.entityType - Type of entity affected
 * @param {ObjectId} params.entityId - ID of entity affected
 * @param {Object} params.changes - Before/after values
 * @param {Object} params.metadata - Additional context (IP, user agent, notes)
 */
const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  changes = {},
  metadata = {},
}) => {
  try {
    return await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      changes,
      metadata,
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break business logic
    console.error("Failed to create audit log:", error);
    return null;
  }
};

/**
 * Get audit logs with filters
 * @param {Object} filters - Query filters
 * @param {Number} limit - Number of records to return
 * @param {Number} skip - Number of records to skip
 */
const getAuditLogs = async (filters = {}, limit = 50, skip = 0) => {
  const query = {};

  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const logs = await AuditLog.find(query)
    .populate("userId", "name email role")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    total,
    page: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get entity history
 * @param {String} entityType - Type of entity
 * @param {ObjectId} entityId - ID of entity
 */
const getEntityHistory = async (entityType, entityId) => {
  return await AuditLog.find({ entityType, entityId })
    .populate("userId", "name email role")
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  getEntityHistory,
};
