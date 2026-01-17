const express = require('express');
const router = express.Router();

const {
    getOnboardingModules,
    updateProgress,
    getNewHireRecommendations
} = require('../controllers/onboardingController');

/**
 * @swagger
 * /onboarding/modules:
 *   get:
 *     summary: Get onboarding modules
 *     tags: [Onboarding]
 *     responses:
 *       200:
 *         description: List of onboarding training modules
 */
router.get('/modules', getOnboardingModules);

/**
 * @swagger
 * /onboarding/progress:
 *   put:
 *     summary: Update onboarding progress
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.put('/progress', updateProgress);

/**
 * @swagger
 * /onboarding/recommendations:
 *   get:
 *     summary: Get recommendations for new hires
 *     tags: [Onboarding]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personalized content recommendations for onboarding
 */
router.get('/recommendations', getNewHireRecommendations);

module.exports = router;
