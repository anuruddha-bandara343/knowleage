const express = require('express');
const router = express.Router();

const {
    getTeamMembers,
    getTrainingResources,
    getEngagementMetrics
} = require('../controllers/kcController');

/**
 * @swagger
 * /kc/team:
 *   get:
 *     summary: Get team members for KC oversight
 *     tags: [Knowledge Champion]
 *     responses:
 *       200:
 *         description: List of team members and their activity
 */
router.get('/team', getTeamMembers);

/**
 * @swagger
 * /kc/training:
 *   get:
 *     summary: Get training resources
 *     tags: [Knowledge Champion]
 *     responses:
 *       200:
 *         description: Available training sessions and materials
 */
router.get('/training', getTrainingResources);

/**
 * @swagger
 * /kc/engagement:
 *   get:
 *     summary: Get engagement metrics
 *     tags: [Knowledge Champion]
 *     responses:
 *       200:
 *         description: User engagement analytics and participation rates
 */
router.get('/engagement', getEngagementMetrics);

module.exports = router;
