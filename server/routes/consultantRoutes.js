const express = require('express');
const router = express.Router();

const {
    getMyUploads,
    getRecommendations,
    getMyActivity
} = require('../controllers/consultantController');

/**
 * @swagger
 * /consultant/my-uploads:
 *   get:
 *     summary: Get user's uploaded documents
 *     tags: [Consultant]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of documents uploaded by the user
 */
router.get('/my-uploads', getMyUploads);

/**
 * @swagger
 * /consultant/recommendations:
 *   get:
 *     summary: Get AI-based recommendations
 *     tags: [Consultant]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personalized document recommendations
 */
router.get('/recommendations', getRecommendations);

/**
 * @swagger
 * /consultant/activity:
 *   get:
 *     summary: Get user's activity stats
 *     tags: [Consultant]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User contribution and activity metrics
 */
router.get('/activity', getMyActivity);

module.exports = router;
