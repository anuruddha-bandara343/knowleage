const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

/**
 * Consultant Controller
 * Personal uploads, recommendations, and activity tracking
 */

/**
 * GET /api/consultant/my-uploads
 * Get user's uploaded documents
 */
exports.getMyUploads = async (req, res) => {
    try {
        const { userId } = req.query;

        const uploads = await Document.find({ uploader: userId })
            .sort({ createdAt: -1 });

        // Stats
        const total = uploads.length;
        const approved = uploads.filter(d => d.status === 'Approved').length;
        const pending = uploads.filter(d => d.status === 'Pending').length;
        const rejected = uploads.filter(d => d.status === 'Rejected').length;

        res.status(200).json({
            success: true,
            data: {
                uploads,
                stats: { total, approved, pending, rejected }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/consultant/recommendations
 * Get AI-based recommendations for consultant
 */
exports.getRecommendations = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId);

        // Get user's interests based on their uploads
        const userDocs = await Document.find({ uploader: userId }).select('domain tags');
        const userDomains = [...new Set(userDocs.map(d => d.domain).filter(Boolean))];
        const userTags = [...new Set(userDocs.flatMap(d => d.tags || []))];

        // Find relevant documents
        let recommendations = await Document.find({
            status: 'Approved',
            uploader: { $ne: userId },
            $or: [
                { domain: { $in: userDomains } },
                { tags: { $in: userTags } }
            ]
        })
            .populate('uploader', 'name')
            .sort({ averageRating: -1, createdAt: -1 })
            .limit(10);

        // If not enough, get top rated
        if (recommendations.length < 5) {
            const fallback = await Document.find({
                status: 'Approved',
                uploader: { $ne: userId }
            })
                .populate('uploader', 'name')
                .sort({ averageRating: -1, createdAt: -1 })
                .limit(10 - recommendations.length);

            recommendations = [...recommendations, ...fallback];
        }

        // Recent highlights
        const recent = await Document.find({ status: 'Approved' })
            .populate('uploader', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                forYou: recommendations,
                recent
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/consultant/activity
 * Get user's recent activity and stats
 */
exports.getMyActivity = async (req, res) => {
    try {
        const { userId } = req.query;

        // Get user stats
        const user = await User.findById(userId).select('name score badges createdAt');

        // Get activity logs
        const activity = await AuditLog.find({ actorId: userId })
            .sort({ timestamp: -1 })
            .limit(30);

        // Get feedback given (ratings/comments)
        const docsRated = await Document.countDocuments({
            'ratings.user': userId
        });

        const docsCommented = await Document.countDocuments({
            'comments.user': userId
        });

        // Activity summary
        const activitySummary = await AuditLog.aggregate([
            { $match: { actorId: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
            { $group: { _id: '$action', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                user,
                recentActivity: activity,
                feedback: { rated: docsRated, commented: docsCommented },
                activitySummary
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
