const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Document = require('../models/Document');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/knowledge-base-cms';

async function checkData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check users
        const users = await User.find({});
        console.log('USERS:', users.length);
        users.forEach(u => console.log(`  - ${u.name} | ${u.email} | ${u.role} | ID: ${u._id}`));

        // Check documents
        console.log('\nDOCUMENTS:');
        const docs = await Document.find({}).populate('uploader', 'name email');
        console.log('  Total:', docs.length);
        docs.forEach(d => console.log(`  - ${d.title} | ${d.status} | Uploader: ${d.uploader?.name || 'NULL (ID: ' + d.uploader + ')'}`));

        // Check approved only
        const approved = await Document.find({ status: 'Approved' }).populate('uploader', 'name');
        console.log('\nAPPROVED DOCS:', approved.length);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
