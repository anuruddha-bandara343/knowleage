const Document = require('../models/Document');
const User = require('../models/User');

/**
 * POST /api/documents/:id/comments
 * Add a comment to a document
 */
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, text } = req.body;

        if (!userId || !text) {
            return res.status(400).json({
                success: false,
                message: 'UserId and text are required'
            });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const newComment = {
            user: userId,
            text,
            createdAt: new Date()
        };

        document.comments.push(newComment);
        await document.save();

        // Populate the user details for immediate display
        const populatedDoc = await Document.findById(id).populate('comments.user', 'name email role');
        const addedComment = populatedDoc.comments[populatedDoc.comments.length - 1];

        // Notify document owner (if not self-comment)
        const commenter = await User.findById(userId);
        if (document.uploader.toString() !== userId && commenter) {
            const Notification = require('../models/Notification');
            await Notification.create({
                recipient: document.uploader,
                type: 'COMMENT',
                title: 'New Comment 💬',
                message: `${commenter.name} commented on "${document.title}"`,
                relatedDocument: document._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Comment added successfully',
            data: addedComment
        });

    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding comment',
            error: error.message
        });
    }
};

/**
 * DELETE /api/documents/:id/comments/:commentId
 * Delete a comment
 */
exports.deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        document.comments = document.comments.filter(c => c._id.toString() !== commentId);
        await document.save();

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting comment',
            error: error.message
        });
    }
};
