/**
 * Content Service - Business Logic for Documents
 */

const Document = require('../models/Document');
const ContentVersion = require('../models/ContentVersion');
const User = require('../models/User');
const auditService = require('./audit.service');

class ContentService {
    /**
     * Create a new document
     */
    async createDocument(data, userId) {
        const { title, description, domain, region, tags, metadata, fileUrls } = data;

        // Check for duplicates
        const duplicates = await Document.findSimilarByTitle(title);
        const isDuplicate = duplicates.length > 0 && duplicates[0].similarity >= 80;

        const document = await Document.create({
            title,
            description,
            domain,
            region,
            tags: tags || [],
            metadata: metadata || [],
            fileUrls: fileUrls || [],
            uploader: userId,
            status: 'Pending',
            isDuplicateWarning: isDuplicate,
            similarDocumentId: isDuplicate ? duplicates[0].document._id : null
        });

        // Create initial version
        if (fileUrls && fileUrls.length > 0) {
            await ContentVersion.create({
                documentId: document._id,
                versionNumber: 1,
                title,
                description,
                fileUrl: fileUrls[0],
                createdBy: userId,
                changelog: 'Initial version'
            });
        }

        // Update user score
        const user = await User.findById(userId);
        if (user) {
            user.score += 10;
            await user.save();
            await User.checkAndAwardBadges(userId);
        }

        // Log action
        await auditService.log({
            actorId: userId,
            action: 'UPLOAD',
            targetId: document._id.toString(),
            targetType: 'Document',
            details: `Uploaded document: ${title}`
        });

        return { document, isDuplicate, duplicates };
    }

    /**
     * Get document by ID
     */
    async getDocumentById(id) {
        return Document.findById(id)
            .populate('uploader', 'name email role department profileImage')
            .populate('reviewedBy', 'name email role')
            .populate('likes', 'name')
            .populate('comments.user', 'name profileImage');
    }

    /**
     * Get all documents with filters
     */
    async getDocuments(filters = {}, userId, userRole) {
        let query = {};

        // Role-based visibility
        if (['NewHire', 'Consultant'].includes(userRole)) {
            query.$or = [
                { status: 'Approved' },
                { uploader: userId }
            ];
        }

        // Apply filters
        if (filters.status) query.status = filters.status;
        if (filters.domain) query.domain = filters.domain;
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }

        return Document.find(query)
            .populate('uploader', 'name email role profileImage')
            .sort({ createdAt: -1 })
            .limit(filters.limit || 50);
    }

    /**
     * Update document
     */
    async updateDocument(id, data, userId) {
        const document = await Document.findById(id);
        if (!document) {
            throw new Error('Document not found');
        }

        Object.assign(document, data);
        await document.save();

        await auditService.log({
            actorId: userId,
            action: 'UPDATE',
            targetId: id,
            targetType: 'Document',
            details: `Updated document: ${document.title}`
        });

        return document;
    }

    /**
     * Delete document
     */
    async deleteDocument(id, userId) {
        const document = await Document.findByIdAndDelete(id);
        if (!document) {
            throw new Error('Document not found');
        }

        // Delete versions
        await ContentVersion.deleteMany({ documentId: id });

        await auditService.log({
            actorId: userId,
            action: 'DELETE',
            targetId: id,
            targetType: 'Document',
            details: `Deleted document: ${document.title}`
        });

        return document;
    }

    /**
     * Toggle like on document
     */
    async toggleLike(docId, userId) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        const likeIndex = document.likes.indexOf(userId);
        if (likeIndex > -1) {
            document.likes.splice(likeIndex, 1);
        } else {
            document.likes.push(userId);
            // Award points to uploader
            if (document.uploader.toString() !== userId) {
                const uploader = await User.findById(document.uploader);
                if (uploader) {
                    uploader.score += 2;
                    await uploader.save();
                }
            }
        }

        await document.save();
        return document;
    }

    /**
     * Add comment to document
     */
    async addComment(docId, userId, text) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.comments.push({ user: userId, text });
        await document.save();

        // Award points
        const user = await User.findById(userId);
        if (user) {
            user.score += 1;
            await user.save();
        }

        return document.comments[document.comments.length - 1];
    }

    /**
     * Rate document
     */
    async rateDocument(docId, userId, rating) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        // Remove existing rating
        document.ratings = document.ratings.filter(
            r => r.user.toString() !== userId
        );

        // Add new rating
        document.ratings.push({ user: userId, rating });

        // Recalculate average
        const total = document.ratings.reduce((sum, r) => sum + r.rating, 0);
        document.averageRating = total / document.ratings.length;

        await document.save();
        return document;
    }
}

module.exports = new ContentService();
