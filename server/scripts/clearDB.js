const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/knowledge-base-cms';

async function clearDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.collections();

        // Drop each collection
        for (const collection of collections) {
            await collection.drop();
            console.log(`🗑️  Dropped collection: ${collection.collectionName}`);
        }

        console.log('\n✅ Database cleared successfully!');
        console.log('You can now register a new account with password.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

clearDatabase();
