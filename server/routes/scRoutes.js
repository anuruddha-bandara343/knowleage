const express = require('express');
const router = express.Router();

const {
    getPendingReviews,
    getRepositoryCuration,
    getUsageMonitoring
} = require('../controllers/scController');

/**
 * @swagger
 * /sc/pending:
 *   get:
 *     summary: Get pending documents for review
 *     tags: [Senior Consultant]
 *     responses:
 *       200:
 *         description: Documents awaiting Senior Consultant review
 */
router.get('/pending', getPendingReviews);

/**
 * @swagger
 * /sc/repository:
 *   get:
 *     summary: Get repository curation data
 *     tags: [Senior Consultant]
 *     responses:
 *       200:
 *         description: Repository statistics and curation insights
 */
router.get('/repository', getRepositoryCuration);

/**
 * @swagger
 * /sc/usage:
 *   get:
 *     summary: Get usage monitoring data
 *     tags: [Senior Consultant]
 *     responses:
 *       200:
 *         description: Team usage patterns and analytics
 */
router.get('/usage', getUsageMonitoring);

module.exports = router;
