const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

/**
 * Project Manager Controller
 * Team oversight and knowledge asset management
 */

/**
 * GET /api/pm/team
 * Get team members overview
 */
exports.getTeamOverview = async (req, res) => {
    try {
        // Get all users with their stats
        const users = await User.find({ isActive: true })
            .select('name email role score badges department createdAt')
            .sort({ score: -1 });

        // Get upload counts per user
        const uploadStats = await Document.aggregate([
            { $group: { _id: '$uploader', uploads: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } } } }
        ]);

        const uploadMap = {};
        uploadStats.forEach(stat => {
            uploadMap[stat._id?.toString()] = stat;
        });

        const teamData = users.map(user => ({
            ...user.toObject(),
            uploads: uploadMap[user._id.toString()]?.uploads || 0,
            approved: uploadMap[user._id.toString()]?.approved || 0
        }));

        // Role breakdown
        const roleBreakdown = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                team: teamData,
                totalMembers: users.length,
                roleBreakdown
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/pm/reports
 * Get usage reports for project management
 */
exports.getUsageReports = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Activity by user (last 30 days)
        const userActivity = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$actorId', actions: { $sum: 1 }, lastAction: { $max: '$timestamp' } } },
            { $sort: { actions: -1 } },
            { $limit: 20 }
        ]);

        // Populate user names
        const userIds = userActivity.map(u => u._id);
        const users = await User.find({ _id: { $in: userIds } }).select('name email');
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const activityWithNames = userActivity.map(a => ({
            ...a,
            user: userMap[a._id?.toString()] || { name: 'Unknown', email: '' }
        }));

        // Document status breakdown
        const documentStats = await Document.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Weekly trend (last 4 weeks)
        const weeklyTrend = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $week: '$timestamp' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                userActivity: activityWithNames,
                documentStats,
                weeklyTrend
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/pm/assets
 * Get knowledge assets aligned with projects
 */
exports.getKnowledgeAssets = async (req, res) => {
    try {
        // Get documents grouped by domain/tags
        const byDomain = await Document.aggregate([
            { $match: { status: 'Approved' } },
            { $group: { _id: '$domain', count: { $sum: 1 }, avgRating: { $avg: '$averageRating' } } },
            { $sort: { count: -1 } }
        ]);

        // Top rated documents
        const topRated = await Document.find({ status: 'Approved', averageRating: { $gt: 0 } })
            .sort({ averageRating: -1 })
            .limit(10)
            .select('title description domain averageRating createdAt')
            .populate('uploader', 'name');

        // Recently added
        const recent = await Document.find({ status: 'Approved' })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title description domain averageRating createdAt')
            .populate('uploader', 'name');

        // Tags cloud
        const tagStats = await Document.aggregate([
            { $match: { status: 'Approved' } },
            { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                byDomain,
                topRated,
                recent,
                tagCloud: tagStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
