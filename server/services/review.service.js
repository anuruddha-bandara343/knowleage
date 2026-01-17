/**
 * Review Service - Document Review Workflow
 */

const Document = require('../models/Document');
const Review = require('../models/Review');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auditService = require('./audit.service');

class ReviewService {
    /**
     * Get pending documents for review
     */
    async getPendingReviews(reviewerId, userRole) {
        const reviewerRoles = ['SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure'];

        if (!reviewerRoles.includes(userRole)) {
            throw new Error('Insufficient permissions to review');
        }

        return Document.find({ status: 'Pending' })
            .populate('uploader', 'name email role department')
            .sort({ createdAt: 1 });
    }

    /**
     * Approve document
     */
    async approveDocument(docId, reviewerId) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        const reviewer = await User.findById(reviewerId);

        document.status = 'Approved';
        document.reviewedBy = reviewerId;
        document.reviewedAt = new Date();
        await document.save();

        // Create review record
        await Review.create({
            documentId: docId,
            reviewerId,
            decision: 'Approved',
            reviewedAt: new Date()
        });

        // Notify uploader
        await Notification.createNotification({
            recipient: document.uploader,
            type: 'REVIEW',
            title: 'Document Approved',
            message: `Your document "${document.title}" has been approved.`,
            relatedDocument: docId
        });

        // Award points to reviewer
        if (reviewer) {
            reviewer.score += 5;
            await reviewer.save();
        }

        // Log action
        await auditService.log({
            actorId: reviewerId,
            action: 'APPROVE',
            targetId: docId,
            targetType: 'Document',
            details: `Approved document: ${document.title}`
        });

        return document;
    }

    /**
     * Reject document
     */
    async rejectDocument(docId, reviewerId, reason) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.status = 'Rejected';
        document.reviewedBy = reviewerId;
        document.reviewedAt = new Date();
        document.rejectionReason = reason;
        await document.save();

        // Create review record
        await Review.create({
            documentId: docId,
            reviewerId,
            decision: 'Rejected',
            rejectionReason: reason,
            reviewedAt: new Date()
        });

        // Notify uploader
        await Notification.createNotification({
            recipient: document.uploader,
            type: 'REVIEW',
            title: 'Document Rejected',
            message: `Your document "${document.title}" was rejected. Reason: ${reason}`,
            relatedDocument: docId
        });

        // Log action
        await auditService.log({
            actorId: reviewerId,
            action: 'REJECT',
            targetId: docId,
            targetType: 'Document',
            details: `Rejected document: ${document.title}. Reason: ${reason}`
        });

        return document;
    }

    /**
     * Request revision
     */
    async requestRevision(docId, reviewerId, notes) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.status = 'Draft';
        document.reviewedBy = reviewerId;
        document.reviewedAt = new Date();
        await document.save();

        // Create review record
        await Review.create({
            documentId: docId,
            reviewerId,
            decision: 'RequestRevision',
            revisionNotes: notes,
            reviewedAt: new Date()
        });

        // Notify uploader
        await Notification.createNotification({
            recipient: document.uploader,
            type: 'REVIEW',
            title: 'Revision Requested',
            message: `Revisions requested for "${document.title}": ${notes}`,
            relatedDocument: docId
        });

        return document;
    }

    /**
     * Get review history for a document
     */
    async getReviewHistory(docId) {
        return Review.find({ documentId: docId })
            .populate('reviewerId', 'name email role')
            .sort({ createdAt: -1 });
    }

    /**
     * Get reviewer stats
     */
    async getReviewerStats(reviewerId) {
        const reviews = await Review.find({ reviewerId });

        return {
            total: reviews.length,
            approved: reviews.filter(r => r.decision === 'Approved').length,
            rejected: reviews.filter(r => r.decision === 'Rejected').length,
            revisions: reviews.filter(r => r.decision === 'RequestRevision').length
        };
    }
}

module.exports = new ReviewService();
