const Document = require('../models/Document');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Interaction Controller
 * Handles social interactions like Likes
 */

/**
 * POST /api/documents/:id/like
 * Toggle Like status for a document
 */
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'UserId is required'
            });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already liked
        const likeIndex = document.likes.indexOf(userId);
        let isLiked = false;

        if (likeIndex === -1) {
            // Add like
            document.likes.push(userId);
            isLiked = true;

            // Notify document owner (if not self-like)
            if (document.uploader.toString() !== userId) {
                await Notification.create({
                    recipient: document.uploader,
                    type: 'LIKE',
                    title: 'New Like ❤️',
                    message: `${user.name} liked your document "${document.title}"`,
                    relatedDocument: document._id
                });
            }

        } else {
            // Remove like
            document.likes.splice(likeIndex, 1);
            isLiked = false;
        }

        await document.save();

        res.status(200).json({
            success: true,
            isLiked,
            likesCount: document.likes.length,
            message: isLiked ? 'Document liked' : 'Document unliked'
        });

    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling like',
            error: error.message
        });
    }
};
