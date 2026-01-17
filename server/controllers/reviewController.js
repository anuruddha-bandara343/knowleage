const Document = require('../models/Document');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

/**
 * Review Controller - Implements IReview Interface
 * Handles document approval/rejection with permission checks
 */

// Roles allowed to review
const REVIEWER_ROLES = ['KnowledgeGovernanceCouncil', 'Admin', 'SeniorConsultant', 'ITInfrastructure'];

/**
 * PUT /api/documents/:id/status
 * Update document status (Approve/Reject)
 */
exports.updateDocumentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, status, rejectionReason } = req.body;

        if (!userId || !status) {
            return res.status(400).json({
                success: false,
                message: 'userId and status are required'
            });
        }

        // Validate status
        const validStatuses = ['Approved', 'Rejected', 'Archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // ========== Permission Check ==========
        const reviewer = await User.findById(userId);
        if (!reviewer) {
            return res.status(404).json({
                success: false,
                message: 'Reviewer not found'
            });
        }

        if (!REVIEWER_ROLES.includes(reviewer.role)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied. Only KnowledgeGovernanceCouncil or Admin can review documents.'
            });
        }

        // ========== Update Document ==========
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const previousStatus = document.status;
        document.status = status;
        document.reviewedBy = userId;
        document.reviewedAt = new Date();

        if (status === 'Rejected' && rejectionReason) {
            document.rejectionReason = rejectionReason;
        }

        await document.save();

        // ========== Audit Log ==========
        const action = status === 'Approved' ? 'APPROVE' :
            status === 'Rejected' ? 'REJECT' : 'ARCHIVE';

        await AuditLog.log({
            actorId: userId,
            actorName: reviewer.name,
            actorRole: reviewer.role,
            action,
            targetId: document._id.toString(),
            details: `Status changed from ${previousStatus} to ${status}${rejectionReason ? `: ${rejectionReason}` : ''}`
        });

        // ========== Gamification on Approval ==========
        if (status === 'Approved') {
            // Award 10 points to the uploader
            await User.findByIdAndUpdate(document.uploader, { $inc: { score: 10 } });

            // Check for badge awards
            const badgeResult = await User.checkAndAwardBadges(document.uploader);
            if (badgeResult?.badgesAwarded?.length > 0) {
                for (const badge of badgeResult.badgesAwarded) {
                    await AuditLog.log({
                        actorId: document.uploader,
                        action: 'BADGE_EARNED',
                        targetId: document.uploader.toString(),
                        targetType: 'User',
                        details: `Earned badge: ${badge}`
                    });

                    // Notify user about new badge
                    await Notification.create({
                        recipient: document.uploader,
                        type: 'BADGE_EARNED',
                        title: 'New Badge Earned! 🏆',
                        message: `Congratulations! You earned the "${badge}" badge!`,
                        relatedDocument: document._id
                    });
                }
            }

            // Notify uploader about approval
            await Notification.create({
                recipient: document.uploader,
                type: 'DOCUMENT_APPROVED',
                title: 'Document Approved ✅',
                message: `Your document "${document.title}" has been approved and is now visible to all users.`,
                relatedDocument: document._id
            });

            // Notify ALL users about new knowledge shared
            await Notification.notifyAll({
                type: 'NEW_KNOWLEDGE',
                title: 'New Knowledge Shared 📚',
                message: `New document "${document.title}" is now available.`,
                relatedDocument: document._id
            });
        }

        // ========== Notify on Rejection ==========
        if (status === 'Rejected') {
            await Notification.create({
                recipient: document.uploader,
                type: 'DOCUMENT_REJECTED',
                title: 'Document Rejected ❌',
                message: `Your document "${document.title}" was rejected. Reason: ${rejectionReason || 'No reason provided'}`,
                relatedDocument: document._id
            });
        }

        res.status(200).json({
            success: true,
            message: `Document ${status.toLowerCase()} successfully`,
            data: {
                id: document._id,
                title: document.title,
                status: document.status,
                reviewedBy: reviewer.name,
                reviewedAt: document.reviewedAt
            }
        });

    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating document status',
            error: error.message
        });
    }
};

/**
 * GET /api/documents/pending
 * Get all pending documents for review
 */
exports.getPendingDocuments = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const reviewer = await User.findById(userId);
        if (!reviewer) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!REVIEWER_ROLES.includes(reviewer.role)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied.'
            });
        }

        const documents = await Document.find({ status: 'Pending' })
            .populate('uploader', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending documents',
            error: error.message
        });
    }
};

/**
 * GET /api/documents/:id/history
 * Get audit history for a document
 */
exports.getDocumentHistory = async (req, res) => {
    try {
        const { userId } = req.query; // Expect userId in query for permission check

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Permission Check: Admin/Senior roles OR the Uploader themselves
        const user = await User.findById(userId);
        const isAuthorized = user && (
            ['KnowledgeGovernanceCouncil', 'Admin', 'SeniorConsultant', 'KnowledgeChampion'].includes(user.role) ||
            document.uploader.toString() === userId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied. You can only view history for your own documents.'
            });
        }

        const history = await AuditLog.getDocumentHistory(id);

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching document history',
            error: error.message
        });
    }
};
