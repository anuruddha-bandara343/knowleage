/**
 * Audit Service - Logging and Tracking
 */

const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

class AuditService {
    /**
     * Log an action
     */
    async log(data) {
        const { actorId, action, targetId, targetType, details } = data;

        // Get actor info
        let actorName = 'System';
        let actorRole = 'System';

        if (actorId) {
            const actor = await User.findById(actorId);
            if (actor) {
                actorName = actor.name;
                actorRole = actor.role;
            }
        }

        return AuditLog.log({
            actorId,
            actorName,
            actorRole,
            action,
            targetId,
            targetType,
            details
        });
    }

    /**
     * Get audit logs with filters
     */
    async getLogs(filters = {}) {
        const { action, actorId, targetType, startDate, endDate, limit = 50 } = filters;

        let query = {};

        if (action) query.action = action;
        if (actorId) query.actorId = actorId;
        if (targetType) query.targetType = targetType;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        return AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit);
    }

    /**
     * Get activity summary
     */
    async getActivitySummary(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const summary = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const dailyActivity = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            actionCounts: summary,
            dailyActivity,
            totalActions: summary.reduce((sum, s) => sum + s.count, 0)
        };
    }

    /**
     * Get user activity
     */
    async getUserActivity(userId, limit = 20) {
        return AuditLog.find({ actorId: userId })
            .sort({ timestamp: -1 })
            .limit(limit);
    }

    /**
     * Get document history
     */
    async getDocumentHistory(docId) {
        return AuditLog.find({ targetId: docId, targetType: 'Document' })
            .sort({ timestamp: -1 });
    }
}

module.exports = new AuditService();
