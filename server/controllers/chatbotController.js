const chatbotService = require('../services/chatbot.service');

/**
 * @swagger
 * /api/chatbot/message:
 *   post:
 *     summary: Send a message to the AI chatbot
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message
 *               history:
 *                 type: array
 *                 description: Previous conversation messages
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: AI response received
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
const sendMessage = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Limit message length
        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Message is too long (max 1000 characters)'
            });
        }

        // Limit history length to prevent token overflow
        const limitedHistory = history.slice(-10);

        const response = await chatbotService.chat(message.trim(), limitedHistory);

        res.json({
            success: true,
            data: {
                response,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Chatbot Controller Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process your message. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @swagger
 * /api/chatbot/quick:
 *   post:
 *     summary: Get a quick response for a simple query
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quick response received
 */
const quickQuery = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            });
        }

        const response = await chatbotService.quickResponse(query.trim());

        res.json({
            success: true,
            data: { response }
        });
    } catch (error) {
        console.error('Quick Query Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process query',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    sendMessage,
    quickQuery
};
