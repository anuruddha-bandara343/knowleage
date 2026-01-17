require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');

const PORT = process.env.PORT || 3000;

// Seed default admin user
const seedDefaultAdmin = async () => {
    try {
        const adminEmail = 'admin@knowledgeshare.org';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            await User.create({
                name: 'System Administrator',
                email: adminEmail,
                password: '123456',
                role: 'ITInfrastructure',
                department: 'IT Infrastructure',
                isActive: true
            });
            console.log('✅ Default ITInfrastructure User Created: admin@knowledgeshare.org');
        } else {
            if (existingAdmin.role !== 'ITInfrastructure') {
                existingAdmin.role = 'ITInfrastructure';
                existingAdmin.department = 'IT Infrastructure';
                await existingAdmin.save();
                console.log('🔄 Updated Default User role to ITInfrastructure');
            } else {
                console.log('ℹ️ Default ITInfrastructure User already exists and is correct');
            }
        }
    } catch (err) {
        console.error('❌ Failed to seed default admin:', err);
    }
};

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Seed default admin
        await seedDefaultAdmin();

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 DKN System Server running on port ${PORT}`);
            console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
