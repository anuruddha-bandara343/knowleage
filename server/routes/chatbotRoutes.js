const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Chatbot endpoints
 */

// Note: Authentication is handled at the frontend level (user must be logged in to see chatbot)
// The mock token system doesn't use proper JWTs, so we skip middleware here

// POST /api/chatbot/message - Send message to chatbot
router.post('/message', chatbotController.sendMessage);

// POST /api/chatbot/quick - Quick query (simpler, no history)
router.post('/quick', chatbotController.quickQuery);

module.exports = router;
