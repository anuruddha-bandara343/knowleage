const Document = require('../models/Document');
const User = require('../models/User');

/**
 * POST /api/documents/:id/rate
 * Rate a document
 */
exports.rateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, rating } = req.body;

        if (!userId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'UserId and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if user already rated
        const existingRatingIndex = document.ratings.findIndex(r => r.user.toString() === userId);

        if (existingRatingIndex > -1) {
            // Update existing rating
            document.ratings[existingRatingIndex].rating = rating;
            document.ratings[existingRatingIndex].createdAt = new Date();
        } else {
            // Add new rating
            document.ratings.push({ user: userId, rating });
        }

        // Calculate average
        const totalRating = document.ratings.reduce((sum, r) => sum + r.rating, 0);
        document.averageRating = totalRating / document.ratings.length;

        await document.save();

        res.status(200).json({
            success: true,
            message: 'Rating submitted successfully',
            data: {
                averageRating: document.averageRating,
                ratingCount: document.ratings.length,
                userRating: rating
            }
        });

    } catch (error) {
        console.error('Rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting rating',
            error: error.message
        });
    }
};
