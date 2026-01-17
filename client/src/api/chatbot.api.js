import api from './index';

/**
 * Send a message to the AI chatbot
 * @param {string} message - The user's message
 * @param {Array} history - Conversation history
 * @returns {Promise} API response with AI reply
 */
export const sendMessage = async (message, history = []) => {
    const response = await api.post('/chatbot/message', { message, history });
    return response.data;
};

/**
 * Send a quick query (no history)
 * @param {string} query - The query
 * @returns {Promise} API response
 */
export const quickQuery = async (query) => {
    const response = await api.post('/chatbot/quick', { query });
    return response.data;
};

export default {
    sendMessage,
    quickQuery
};
