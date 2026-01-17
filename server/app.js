const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import routes
const documentRoutes = require('./routes/documentRoutes');
const authRoutes = require('./routes/authRoutes');
const governanceRoutes = require('./routes/governanceRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const pmRoutes = require('./routes/pmRoutes');
const kcRoutes = require('./routes/kcRoutes');
const scRoutes = require('./routes/scRoutes');
const consultantRoutes = require('./routes/consultantRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

// Import middlewares
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DKN API Documentation'
}));

app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/pm', pmRoutes);
app.use('/api/kc', kcRoutes);
app.use('/api/sc', scRoutes);
app.use('/api/consultant', consultantRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Legacy routes for backward compatibility
app.use('/api/contents', documentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'KnowledgeShare DKN System API',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler middleware
app.use(errorMiddleware);

module.exports = app;
