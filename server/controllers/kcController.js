const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

/**
 * Knowledge Champion Controller
 * Training, onboarding management, and team engagement
 */

/**
 * GET /api/kc/team
 * Get team members for KC oversight
 */
exports.getTeamMembers = async (req, res) => {
    try {
        // Get all users with onboarding and activity info
        const users = await User.find({ isActive: true })
            .select('name email role score badges onboardingProgress createdAt')
            .sort({ createdAt: -1 });

        // Get new hires (users created in last 30 days or with onboarding < 100%)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newHires = users.filter(u =>
            u.role === 'NewHire' ||
            u.onboardingProgress < 100 ||
            new Date(u.createdAt) >= thirtyDaysAgo
        );

        // Team stats
        const totalActive = users.length;
        const fullyOnboarded = users.filter(u => u.onboardingProgress >= 100).length;
        const newHireCount = users.filter(u => u.role === 'NewHire').length;

        res.status(200).json({
            success: true,
            data: {
                allMembers: users,
                newHires,
                stats: {
                    totalActive,
                    fullyOnboarded,
                    newHireCount,
                    onboardingRate: totalActive > 0 ? Math.round((fullyOnboarded / totalActive) * 100) : 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/kc/training
 * Get training resources and sessions
 */
exports.getTrainingResources = async (req, res) => {
    try {
        // Get documents tagged as training/learning materials
        const trainingDocs = await Document.find({
            status: 'Approved',
            $or: [
                { tags: { $in: ['training', 'learning', 'tutorial', 'guide', 'onboarding'] } },
                { domain: { $in: ['Training', 'Learning', 'HR', 'Onboarding'] } }
            ]
        })
            .populate('uploader', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get top contributors to training content
        const topContributors = await Document.aggregate([
            { $match: { tags: { $in: ['training', 'learning', 'tutorial'] } } },
            { $group: { _id: '$uploader', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Populate contributor names
        const contributorIds = topContributors.map(c => c._id);
        const contributors = await User.find({ _id: { $in: contributorIds } }).select('name');
        const contributorMap = {};
        contributors.forEach(c => { contributorMap[c._id.toString()] = c.name; });

        const topContributorsWithNames = topContributors.map(c => ({
            name: contributorMap[c._id?.toString()] || 'Unknown',
            contributions: c.count
        }));

        res.status(200).json({
            success: true,
            data: {
                trainingDocs,
                topContributors: topContributorsWithNames,
                totalTrainingResources: trainingDocs.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/kc/engagement
 * Get engagement metrics
 */
exports.getEngagementMetrics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Activity by action type
        const activityByType = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Most engaged users
        const engagedUsers = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$actorId', actions: { $sum: 1 } } },
            { $sort: { actions: -1 } },
            { $limit: 10 }
        ]);

        // Populate user names
        const userIds = engagedUsers.map(u => u._id);
        const users = await User.find({ _id: { $in: userIds } }).select('name email role');
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const engagedWithNames = engagedUsers.map(u => ({
            ...u,
            user: userMap[u._id?.toString()] || { name: 'Unknown' }
        }));

        // Badge leaderboard
        const badgeLeaders = await User.find({ 'badges.0': { $exists: true } })
            .select('name badges score')
            .sort({ 'badges.length': -1, score: -1 })
            .limit(10);

        // Daily engagement trend
        const dailyTrend = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 14 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                activityByType,
                engagedUsers: engagedWithNames,
                badgeLeaders,
                dailyTrend
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
