const Document = require('../models/Document');
const User = require('../models/User');

/**
 * Search Controller - Implements ISearch Interface
 * Handles document search with role-based visibility
 */

/**
 * GET /api/search
 * Search documents with filters
 */
exports.searchDocuments = async (req, res) => {
    try {
        const {
            userId,
            query,
            domain,
            region,
            status,
            tags,
            page = 1,
            limit = 10
        } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build query
        let searchQuery = {};

        // Role-based visibility
        if (user.role === 'Consultant') {
            // Consultants can only see approved documents
            searchQuery.status = 'Approved';
        } else if (status) {
            // Other roles can filter by status
            searchQuery.status = status;
        }

        // Text search
        if (query) {
            searchQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ];
        }

        // Domain filter
        if (domain) {
            searchQuery.domain = { $regex: domain, $options: 'i' };
        }

        // Region filter
        if (region) {
            searchQuery.region = { $regex: region, $options: 'i' };
        }

        // Tags filter
        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            searchQuery.tags = { $in: tagArray };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Document.countDocuments(searchQuery);

        const documents = await Document.find(searchQuery)
            .populate('uploader', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: documents.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            userRole: user.role,
            data: documents
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching documents',
            error: error.message
        });
    }
};

/**
 * GET /api/search/suggestions
 * Get search suggestions based on partial query
 */
exports.getSearchSuggestions = async (req, res) => {
    try {
        const { query, userId } = req.query;

        if (!query || query.length < 2) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const user = await User.findById(userId);
        let matchQuery = { title: { $regex: query, $options: 'i' } };

        if (user?.role === 'Consultant') {
            matchQuery.status = 'Approved';
        }

        const suggestions = await Document.find(matchQuery)
            .select('title domain')
            .limit(5)
            .lean();

        res.status(200).json({
            success: true,
            data: suggestions.map(d => ({
                title: d.title,
                domain: d.domain
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching suggestions',
            error: error.message
        });
    }
};

/**
 * GET /api/documents/stats
 * Get document statistics
 */
exports.getDocumentStats = async (req, res) => {
    try {
        const { userId } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only admins and senior roles can see full stats
        const canSeeFullStats = ['SeniorConsultant', 'KnowledgeChampion', 'Admin'].includes(user.role);

        const stats = {
            approved: await Document.countDocuments({ status: 'Approved' }),
            total: canSeeFullStats ? await Document.countDocuments() : undefined,
            pending: canSeeFullStats ? await Document.countDocuments({ status: 'Pending' }) : undefined,
            rejected: canSeeFullStats ? await Document.countDocuments({ status: 'Rejected' }) : undefined,
            sensitive: canSeeFullStats ? await Document.countDocuments({ isSensitive: true }) : undefined
        };

        // Get domain distribution
        const domainStats = await Document.aggregate([
            { $match: canSeeFullStats ? {} : { status: 'Approved' } },
            { $group: { _id: '$domain', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...stats,
                topDomains: domainStats.map(d => ({
                    domain: d._id || 'Uncategorized',
                    count: d.count
                }))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};

/**
 * GET /api/documents/recommendations
 * Get AI-simulated recommendations
 */
exports.getRecommendations = async (req, res) => {
    try {
        const { userId } = req.query;

        // Get random approved documents that are NOT uploaded by this user
        // In a real AI system, this would use vector embeddings or collaborative filtering
        const recommendations = await Document.aggregate([
            {
                $match: {
                    status: 'Approved',
                    uploader: { $ne: new require('mongoose').Types.ObjectId(userId) }
                }
            },
            { $sample: { size: 3 } } // Randomly select 3 documents
        ]);

        // Populate uploader details
        await Document.populate(recommendations, { path: 'uploader', select: 'name role' });

        res.status(200).json({
            success: true,
            data: recommendations
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching recommendations',
            error: error.message
        });
    }
};
