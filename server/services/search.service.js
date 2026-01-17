/**
 * Search Service - Document Search and Filtering
 */

const Document = require('../models/Document');
const Tag = require('../models/Tag');

class SearchService {
    /**
     * Full-text search
     */
    async search(query, filters = {}, userId, userRole) {
        let searchQuery = {};

        // Text search
        if (query) {
            searchQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ];
        }

        // Role-based visibility
        if (['NewHire', 'Consultant'].includes(userRole)) {
            searchQuery.status = 'Approved';
        } else if (filters.status) {
            searchQuery.status = filters.status;
        }

        // Domain filter
        if (filters.domain) {
            searchQuery.domain = filters.domain;
        }

        // Region filter
        if (filters.region) {
            searchQuery.region = filters.region;
        }

        // Tag filter
        if (filters.tags && filters.tags.length > 0) {
            searchQuery.tags = { $in: filters.tags };
        }

        // Date range filter
        if (filters.startDate || filters.endDate) {
            searchQuery.createdAt = {};
            if (filters.startDate) {
                searchQuery.createdAt.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                searchQuery.createdAt.$lte = new Date(filters.endDate);
            }
        }

        const results = await Document.find(searchQuery)
            .populate('uploader', 'name email role profileImage')
            .sort({ createdAt: -1 })
            .limit(filters.limit || 20);

        return {
            results,
            total: results.length,
            query,
            filters
        };
    }

    /**
     * Get search suggestions (autocomplete)
     */
    async getSuggestions(query, userId) {
        if (!query || query.length < 2) {
            return [];
        }

        // Get matching documents
        const documents = await Document.find({
            status: 'Approved',
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        })
            .select('title tags')
            .limit(5);

        // Get matching tags
        const tags = await Tag.find({
            name: { $regex: query, $options: 'i' }
        })
            .select('displayName')
            .limit(5);

        return {
            documents: documents.map(d => ({ type: 'document', text: d.title })),
            tags: tags.map(t => ({ type: 'tag', text: t.displayName }))
        };
    }

    /**
     * Get popular tags
     */
    async getPopularTags(limit = 10) {
        return Tag.find({ isActive: true })
            .sort({ usageCount: -1 })
            .limit(limit);
    }

    /**
     * Get document stats
     */
    async getStats(userId) {
        const [approved, pending, total, topDomains] = await Promise.all([
            Document.countDocuments({ status: 'Approved' }),
            Document.countDocuments({ status: 'Pending' }),
            Document.countDocuments(),
            Document.aggregate([
                { $match: { status: 'Approved' } },
                { $group: { _id: '$domain', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        return {
            approved,
            pending,
            total,
            topDomains
        };
    }

    /**
     * Advanced search with metadata
     */
    async advancedSearch(params) {
        const { query, metadata = [], tags = [], dateRange, sortBy = 'createdAt', sortOrder = -1 } = params;

        let searchQuery = { status: 'Approved' };

        if (query) {
            searchQuery.$text = { $search: query };
        }

        // Metadata filters
        if (metadata.length > 0) {
            searchQuery.metadata = {
                $elemMatch: {
                    $or: metadata.map(m => ({ key: m.key, value: m.value }))
                }
            };
        }

        // Tags filter
        if (tags.length > 0) {
            searchQuery.tags = { $all: tags };
        }

        return Document.find(searchQuery)
            .populate('uploader', 'name email role')
            .sort({ [sortBy]: sortOrder })
            .limit(50);
    }
}

module.exports = new SearchService();
