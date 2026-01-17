const express = require('express');
const router = express.Router();

const {
    getTeamOverview,
    getUsageReports,
    getKnowledgeAssets
} = require('../controllers/pmController');

/**
 * @swagger
 * /pm/team:
 *   get:
 *     summary: Get team members overview
 *     tags: [Project Manager]
 *     responses:
 *       200:
 *         description: Team composition and contribution stats
 */
router.get('/team', getTeamOverview);

/**
 * @swagger
 * /pm/reports:
 *   get:
 *     summary: Get usage reports
 *     tags: [Project Manager]
 *     responses:
 *       200:
 *         description: Knowledge base usage statistics and reports
 */
router.get('/reports', getUsageReports);

/**
 * @swagger
 * /pm/assets:
 *   get:
 *     summary: Get knowledge assets
 *     tags: [Project Manager]
 *     responses:
 *       200:
 *         description: List of knowledge assets for project planning
 */
router.get('/assets', getKnowledgeAssets);

module.exports = router;
