const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

/**
 * Senior Consultant Controller
 * Content validation, repository curation, and usage monitoring
 */

/**
 * GET /api/sc/pending
 * Get pending documents for review
 */
exports.getPendingReviews = async (req, res) => {
    try {
        const pending = await Document.find({ status: 'Pending' })
            .populate('uploader', 'name email role')
            .sort({ createdAt: -1 });

        // Get review stats
        const totalPending = pending.length;
        const approved = await Document.countDocuments({ status: 'Approved' });
        const rejected = await Document.countDocuments({ status: 'Rejected' });

        res.status(200).json({
            success: true,
            data: {
                pending,
                stats: {
                    totalPending,
                    approved,
                    rejected,
                    total: totalPending + approved + rejected
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/sc/repository
 * Get repository curation data
 */
exports.getRepositoryCuration = async (req, res) => {
    try {
        // Documents by status
        const byStatus = await Document.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Documents by domain
        const byDomain = await Document.aggregate([
            { $match: { status: 'Approved' } },
            { $group: { _id: '$domain', count: { $sum: 1 }, avgRating: { $avg: '$averageRating' } } },
            { $sort: { count: -1 } }
        ]);

        // Low rated documents (below 3.0)
        const lowRated = await Document.find({
            status: 'Approved',
            averageRating: { $gt: 0, $lt: 3 }
        })
            .select('title averageRating uploader createdAt')
            .populate('uploader', 'name')
            .limit(10);

        // Old documents (no updates in 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const stale = await Document.find({
            status: 'Approved',
            updatedAt: { $lt: ninetyDaysAgo }
        })
            .select('title updatedAt domain')
            .limit(10);

        // Documents without proper tags
        const untagged = await Document.find({
            status: 'Approved',
            $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }]
        })
            .select('title domain uploader')
            .populate('uploader', 'name')
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                byStatus,
                byDomain,
                issueFlags: {
                    lowRated,
                    stale,
                    untagged
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/sc/usage
 * Get usage monitoring data
 */
exports.getUsageMonitoring = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Recent activity
        const recentActivity = await AuditLog.find({ timestamp: { $gte: thirtyDaysAgo } })
            .sort({ timestamp: -1 })
            .limit(50);

        // Activity by day
        const dailyActivity = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Action breakdown
        const actionBreakdown = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Top uploaders
        const topUploaders = await Document.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$uploader', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Populate uploader names
        const uploaderIds = topUploaders.map(u => u._id);
        const uploaders = await User.find({ _id: { $in: uploaderIds } }).select('name');
        const uploaderMap = {};
        uploaders.forEach(u => { uploaderMap[u._id.toString()] = u.name; });

        const topUploadersWithNames = topUploaders.map(u => ({
            name: uploaderMap[u._id?.toString()] || 'Unknown',
            uploads: u.count
        }));

        res.status(200).json({
            success: true,
            data: {
                recentActivity: recentActivity.slice(0, 20),
                dailyActivity,
                actionBreakdown,
                topUploaders: topUploadersWithNames
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
