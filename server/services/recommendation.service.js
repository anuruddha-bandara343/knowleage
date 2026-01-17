/**
 * Recommendation Service - AI-powered content recommendations
 */

const Document = require('../models/Document');
const User = require('../models/User');

class RecommendationService {
    /**
     * Get personalized recommendations for a user
     */
    async getRecommendations(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get user's interaction history
        const likedDocs = await Document.find({
            likes: userId,
            status: 'Approved'
        }).select('domain tags');

        // Extract preferred domains and tags
        const preferredDomains = [...new Set(likedDocs.map(d => d.domain).filter(Boolean))];
        const preferredTags = [...new Set(likedDocs.flatMap(d => d.tags || []))];

        // Build recommendation query
        let query = {
            status: 'Approved',
            uploader: { $ne: userId }, // Exclude own documents
            likes: { $ne: userId } // Exclude already liked
        };

        if (preferredDomains.length > 0 || preferredTags.length > 0) {
            query.$or = [];
            if (preferredDomains.length > 0) {
                query.$or.push({ domain: { $in: preferredDomains } });
            }
            if (preferredTags.length > 0) {
                query.$or.push({ tags: { $in: preferredTags } });
            }
        }

        // Get recommendations
        const recommendations = await Document.find(query)
            .populate('uploader', 'name role profileImage')
            .sort({ averageRating: -1, createdAt: -1 })
            .limit(10);

        // If not enough recommendations, add popular documents
        if (recommendations.length < 5) {
            const popular = await Document.find({
                status: 'Approved',
                _id: { $nin: recommendations.map(r => r._id) },
                uploader: { $ne: userId }
            })
                .populate('uploader', 'name role profileImage')
                .sort({ 'likes.length': -1, averageRating: -1 })
                .limit(10 - recommendations.length);

            recommendations.push(...popular);
        }

        return recommendations.map(doc => ({
            ...doc.toObject(),
            reason: this.getRecommendationReason(doc, preferredDomains, preferredTags)
        }));
    }

    /**
     * Get recommendation reason
     */
    getRecommendationReason(doc, preferredDomains, preferredTags) {
        if (preferredDomains.includes(doc.domain)) {
            return `Based on your interest in ${doc.domain}`;
        }
        if (doc.tags?.some(t => preferredTags.includes(t))) {
            return 'Based on your reading history';
        }
        if (doc.averageRating >= 4) {
            return 'Highly rated by others';
        }
        return 'Popular in your organization';
    }

    /**
     * Get similar documents
     */
    async getSimilarDocuments(docId, limit = 5) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        // Find documents with similar tags or domain
        const similar = await Document.find({
            _id: { $ne: docId },
            status: 'Approved',
            $or: [
                { domain: document.domain },
                { tags: { $in: document.tags || [] } }
            ]
        })
            .populate('uploader', 'name role profileImage')
            .sort({ averageRating: -1 })
            .limit(limit);

        return similar;
    }

    /**
     * Get trending documents
     */
    async getTrending(days = 7, limit = 10) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return Document.find({
            status: 'Approved',
            createdAt: { $gte: startDate }
        })
            .populate('uploader', 'name role profileImage')
            .sort({ 'likes.length': -1, 'comments.length': -1 })
            .limit(limit);
    }

    /**
     * Get role-based recommendations
     */
    async getRoleBasedRecommendations(role) {
        const roleKeywords = {
            NewHire: ['onboarding', 'getting started', 'introduction', 'basics'],
            Consultant: ['best practices', 'templates', 'guidelines'],
            SeniorConsultant: ['advanced', 'methodology', 'framework'],
            ProjectManager: ['project', 'management', 'planning', 'reporting'],
            KnowledgeChampion: ['training', 'knowledge', 'documentation']
        };

        const keywords = roleKeywords[role] || [];

        if (keywords.length === 0) {
            return this.getTrending();
        }

        return Document.find({
            status: 'Approved',
            $or: keywords.map(kw => ({
                $or: [
                    { title: { $regex: kw, $options: 'i' } },
                    { tags: { $regex: kw, $options: 'i' } }
                ]
            }))
        })
            .populate('uploader', 'name role profileImage')
            .sort({ averageRating: -1 })
            .limit(10);
    }
}

module.exports = new RecommendationService();
