const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Document = require('../models/Document');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/knowledge-base-cms';

async function fixUploaderIds() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the current user
        const user = await User.findOne({ email: 'mahima@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (ID: ${user._id})`);

        // Update all documents to use this user's ID
        const result = await Document.updateMany(
            {},
            { $set: { uploader: user._id } }
        );

        console.log(`✅ Updated ${result.modifiedCount} documents with correct uploader ID`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixUploaderIds();
