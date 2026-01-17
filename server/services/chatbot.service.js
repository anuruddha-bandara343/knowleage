const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Import services for real-time data access
const gamificationService = require('./gamification.service');
const Document = require('../models/Document');
const User = require('../models/User');

// Available models to try in order (fallback strategy)
const AVAILABLE_MODELS = [
    'gemini-1.5-flash-8b',      // Smaller, often has separate quota
    'gemini-1.5-flash',         // Standard flash model
    'gemini-2.0-flash-exp',     // Experimental version
    'gemini-1.5-pro',           // Pro model (slower but different quota)
    'gemini-2.0-flash',         // Latest flash (may have quota issues)
];

// System context for the chatbot
const SYSTEM_CONTEXT = `You are a helpful AI assistant for the KnowledgeShare Digital Knowledge Network (DKN) system. 
This is a knowledge management platform where employees can:
- Upload and share documents
- Search for knowledge resources
- Get recommendations based on their interests
- Earn points and badges through gamification
- Collaborate with colleagues

Your role is to:
1. Help users navigate the knowledge base
2. Answer questions about using the system
3. Provide guidance on finding relevant documents
4. Explain features like the leaderboard, badges, and document review process
5. Assist with general knowledge queries

IMPORTANT: You have access to REAL-TIME DATA from the system. When system data is provided below, use it to give accurate, specific answers. Do not say you don't have access to data when data is provided.

Be friendly, concise, and helpful.`;

/**
 * Fetch real-time system data based on user query
 */
const fetchRelevantData = async (query) => {
    const lowerQuery = query.toLowerCase();
    const dataContext = [];

    try {
        // Check if query is about leaderboard/rankings
        if (lowerQuery.includes('leaderboard') ||
            lowerQuery.includes('rank') ||
            lowerQuery.includes('top') ||
            lowerQuery.includes('1st') ||
            lowerQuery.includes('first') ||
            lowerQuery.includes('who is') ||
            lowerQuery.includes('leader') ||
            lowerQuery.includes('score') ||
            lowerQuery.includes('points')) {

            const leaderboard = await gamificationService.getLeaderboard(10, 'allTime');
            if (leaderboard && leaderboard.length > 0) {
                const leaderboardText = leaderboard.map((entry, idx) =>
                    `${idx + 1}. ${entry.user.name} (${entry.user.department || 'No dept'}) - ${entry.score} points, ${entry.badgeCount} badges`
                ).join('\n');
                dataContext.push(`\n📊 CURRENT LEADERBOARD (Top ${leaderboard.length}):\n${leaderboardText}`);
            }
        }

        // Check if query is about documents/content
        if (lowerQuery.includes('document') ||
            lowerQuery.includes('content') ||
            lowerQuery.includes('upload') ||
            lowerQuery.includes('recent') ||
            lowerQuery.includes('how many')) {

            const totalDocs = await Document.countDocuments({ status: 'Approved' });
            const recentDocs = await Document.find({ status: 'Approved' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title category createdAt');

            let docsText = `Total approved documents: ${totalDocs}`;
            if (recentDocs.length > 0) {
                docsText += '\n\nRecent documents:\n' + recentDocs.map((doc, idx) =>
                    `${idx + 1}. "${doc.title}" (${doc.category})`
                ).join('\n');
            }
            dataContext.push(`\n📄 DOCUMENT STATS:\n${docsText}`);
        }

        // Check if query is about users/members
        if (lowerQuery.includes('user') ||
            lowerQuery.includes('member') ||
            lowerQuery.includes('employee') ||
            lowerQuery.includes('how many people')) {

            const totalUsers = await User.countDocuments({ isActive: true });
            const roleBreakdown = await User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]);

            const rolesText = roleBreakdown.map(r => `${r._id}: ${r.count}`).join(', ');
            dataContext.push(`\n👥 USER STATS:\nTotal active users: ${totalUsers}\nBy role: ${rolesText}`);
        }

        // Check if query is about badges
        if (lowerQuery.includes('badge') || lowerQuery.includes('achievement')) {
            const { BADGES } = require('./gamification.service');
            const badgeList = Object.values(BADGES).map(b =>
                `${b.icon} ${b.name}: ${b.description}`
            ).join('\n');
            dataContext.push(`\n🏆 AVAILABLE BADGES:\n${badgeList}`);
        }

        // Check if query is about knowledge feed / recommendations / trending
        if (lowerQuery.includes('feed') ||
            lowerQuery.includes('recommend') ||
            lowerQuery.includes('suggest') ||
            lowerQuery.includes('trending') ||
            lowerQuery.includes('popular') ||
            lowerQuery.includes('what should i read') ||
            lowerQuery.includes('new content') ||
            lowerQuery.includes('latest')) {

            const recommendationService = require('./recommendation.service');

            // Get trending documents
            const trending = await recommendationService.getTrending(7, 5);
            if (trending && trending.length > 0) {
                const trendingText = trending.map((doc, idx) =>
                    `${idx + 1}. "${doc.title}" by ${doc.uploader?.name || 'Unknown'} - ${doc.likes?.length || 0} likes`
                ).join('\n');
                dataContext.push(`\n🔥 TRENDING THIS WEEK:\n${trendingText}`);
            }

            // Get popular documents (by rating)
            const popular = await Document.find({ status: 'Approved' })
                .sort({ averageRating: -1, likeCount: -1 })
                .limit(5)
                .select('title category averageRating likeCount');

            if (popular && popular.length > 0) {
                const popularText = popular.map((doc, idx) =>
                    `${idx + 1}. "${doc.title}" (${doc.category}) - ⭐${doc.averageRating?.toFixed(1) || 'N/A'} rating, ${doc.likeCount || 0} likes`
                ).join('\n');
                dataContext.push(`\n⭐ TOP RATED CONTENT:\n${popularText}`);
            }
        }

        // Check if query is about categories/domains
        if (lowerQuery.includes('category') ||
            lowerQuery.includes('domain') ||
            lowerQuery.includes('topic') ||
            lowerQuery.includes('what kind')) {

            const categories = await Document.aggregate([
                { $match: { status: 'Approved' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            if (categories && categories.length > 0) {
                const catText = categories.map(c => `${c._id}: ${c.count} docs`).join(', ');
                dataContext.push(`\n📁 CONTENT CATEGORIES:\n${catText}`);
            }
        }

        // Check if query is about training/onboarding/courses
        if (lowerQuery.includes('training') ||
            lowerQuery.includes('course') ||
            lowerQuery.includes('onboarding') ||
            lowerQuery.includes('learn') ||
            lowerQuery.includes('module')) {

            const TrainingSession = require('../models/TrainingSession');
            const trainings = await TrainingSession.find({ isActive: true })
                .select('title type duration enrolledUsers')
                .limit(10);

            if (trainings && trainings.length > 0) {
                const trainingText = trainings.map((t, idx) =>
                    `${idx + 1}. "${t.title}" (${t.type}) - ${t.duration || 0} mins, ${t.enrolledUsers?.length || 0} enrolled`
                ).join('\n');
                dataContext.push(`\n📚 AVAILABLE TRAINING SESSIONS:\n${trainingText}`);
            }
        }

        // Check if query is about activity/audit/history/logs
        if (lowerQuery.includes('activity') ||
            lowerQuery.includes('audit') ||
            lowerQuery.includes('history') ||
            lowerQuery.includes('log') ||
            lowerQuery.includes('recent action')) {

            const AuditLog = require('../models/AuditLog');
            const recentLogs = await AuditLog.find()
                .sort({ timestamp: -1 })
                .limit(10)
                .select('action actorName details timestamp');

            if (recentLogs && recentLogs.length > 0) {
                const logsText = recentLogs.map((log, idx) =>
                    `${idx + 1}. ${log.action} by ${log.actorName || 'System'} - ${log.details || 'No details'}`
                ).join('\n');
                dataContext.push(`\n📋 RECENT SYSTEM ACTIVITY:\n${logsText}`);
            }
        }

        // Check if query is about notifications/alerts
        if (lowerQuery.includes('notification') ||
            lowerQuery.includes('alert') ||
            lowerQuery.includes('message')) {

            const Notification = require('../models/Notification');
            const recentNotifications = await Notification.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('type title message');

            if (recentNotifications && recentNotifications.length > 0) {
                const notifText = recentNotifications.map((n, idx) =>
                    `${idx + 1}. [${n.type}] ${n.title}`
                ).join('\n');
                dataContext.push(`\n🔔 RECENT NOTIFICATIONS:\n${notifText}`);
            }
        }

        // Check if query is about reviews/pending/approval
        if (lowerQuery.includes('review') ||
            lowerQuery.includes('pending') ||
            lowerQuery.includes('approval') ||
            lowerQuery.includes('waiting')) {

            const pendingDocs = await Document.find({ status: 'Pending' })
                .select('title uploader createdAt')
                .populate('uploader', 'name')
                .limit(10);

            if (pendingDocs && pendingDocs.length > 0) {
                const pendingText = pendingDocs.map((doc, idx) =>
                    `${idx + 1}. "${doc.title}" by ${doc.uploader?.name || 'Unknown'}`
                ).join('\n');
                dataContext.push(`\n⏳ PENDING REVIEW (${pendingDocs.length} items):\n${pendingText}`);
            }

            const approvedCount = await Document.countDocuments({ status: 'Approved' });
            const rejectedCount = await Document.countDocuments({ status: 'Rejected' });
            dataContext.push(`\n📊 REVIEW STATS: ${approvedCount} approved, ${rejectedCount} rejected`);
        }

        // Check if query is about tags
        if (lowerQuery.includes('tag')) {
            const allDocs = await Document.find({ status: 'Approved' }).select('tags');
            const tagCounts = {};
            allDocs.forEach(doc => {
                (doc.tags || []).forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });
            const sortedTags = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .map(([tag, count]) => `${tag}: ${count}`)
                .join(', ');

            if (sortedTags) {
                dataContext.push(`\n🏷️ POPULAR TAGS:\n${sortedTags}`);
            }
        }

        // Check if query is asking for system overview/stats/summary
        if (lowerQuery.includes('overview') ||
            lowerQuery.includes('stats') ||
            lowerQuery.includes('summary') ||
            lowerQuery.includes('dashboard') ||
            lowerQuery.includes('system') ||
            lowerQuery.includes('everything') ||
            lowerQuery.includes('all data')) {

            const totalDocs = await Document.countDocuments({ status: 'Approved' });
            const pendingDocs = await Document.countDocuments({ status: 'Pending' });
            const totalUsers = await User.countDocuments({ isActive: true });
            const leaderboard = await gamificationService.getLeaderboard(3, 'allTime');

            let overviewText = `📊 SYSTEM OVERVIEW:
- Total approved documents: ${totalDocs}
- Pending review: ${pendingDocs}
- Active users: ${totalUsers}`;

            if (leaderboard && leaderboard.length > 0) {
                overviewText += `\n- Top contributor: ${leaderboard[0].user.name} (${leaderboard[0].score} pts)`;
            }

            dataContext.push(`\n${overviewText}`);
        }

    } catch (error) {
        console.error('Error fetching data for chatbot:', error.message);
    }

    return dataContext.length > 0
        ? '\n\n--- REAL-TIME SYSTEM DATA ---' + dataContext.join('\n') + '\n--- END DATA ---\n'
        : '';
};

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chat with the AI assistant (with retry and fallback)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @returns {Promise<string>} - The AI's response
 */
const chat = async (userMessage, conversationHistory = []) => {
    const maxRetries = 3;
    let lastError = null;

    // Fetch relevant real-time data based on the user's query
    const systemData = await fetchRelevantData(userMessage);
    const enhancedContext = SYSTEM_CONTEXT + systemData;

    for (const modelName of AVAILABLE_MODELS) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxRetries} with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Build the conversation context with real-time data
                const messages = [
                    { role: 'user', parts: [{ text: enhancedContext }] },
                    { role: 'model', parts: [{ text: 'I understand. I am the KnowledgeShare DKN assistant with access to real-time system data. I can answer questions about the leaderboard, documents, users, and badges accurately.' }] },
                    ...conversationHistory.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    })),
                    { role: 'user', parts: [{ text: userMessage }] }
                ];

                // Start a chat session
                const chatSession = model.startChat({
                    history: messages.slice(0, -1),
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.7,
                    },
                });

                // Send the user's message and get a response
                const result = await chatSession.sendMessage(userMessage);
                const response = await result.response;

                console.log(`Success with model: ${modelName}`);
                return response.text();
            } catch (error) {
                lastError = error;
                console.error(`Error with ${modelName} (attempt ${attempt}):`, error.message);

                // Check if it's a rate limit error
                if (error.message && error.message.includes('429')) {
                    const retryMatch = error.message.match(/retry in (\d+\.?\d*)/i);
                    const retryMs = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 1000;

                    if (attempt < maxRetries) {
                        console.log(`Rate limited. Waiting ${retryMs}ms before retry...`);
                        await sleep(Math.min(retryMs + 500, 5000));
                    }
                } else {
                    break;
                }
            }
        }
    }

    const errorMessage = lastError?.message || 'Unknown error';
    throw new Error(`AI Error: ${errorMessage}`);
};

/**
 * Get a quick response for simple queries (with retry and fallback)
 * @param {string} query - The user's query
 * @returns {Promise<string>} - The AI's response
 */
const quickResponse = async (query) => {
    const maxRetries = 3;
    let lastError = null;

    // Fetch relevant real-time data
    const systemData = await fetchRelevantData(query);
    const enhancedContext = SYSTEM_CONTEXT + systemData;

    for (const modelName of AVAILABLE_MODELS) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Quick response attempt ${attempt}/${maxRetries} with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const prompt = `${enhancedContext}\n\nUser Query: ${query}\n\nProvide a brief, helpful response based on the real-time data provided:`;

                const result = await model.generateContent(prompt);
                const response = await result.response;

                console.log(`Success with model: ${modelName}`);
                return response.text();
            } catch (error) {
                lastError = error;
                console.error(`Error with ${modelName} (attempt ${attempt}):`, error.message);

                if (error.message && error.message.includes('429')) {
                    const retryMatch = error.message.match(/retry in (\d+\.?\d*)/i);
                    const retryMs = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 1000;

                    if (attempt < maxRetries) {
                        await sleep(Math.min(retryMs + 500, 5000));
                    }
                } else {
                    break;
                }
            }
        }
    }

    const errorMessage = lastError?.message || 'Unknown error';
    throw new Error(`AI Error: ${errorMessage}`);
};

module.exports = {
    chat,
    quickResponse
};
