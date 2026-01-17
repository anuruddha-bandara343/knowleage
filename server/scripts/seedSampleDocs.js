const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Document = require('../models/Document');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/knowledge-base-cms';

async function seedSampleData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find the current user (mahima)
        const mahima = await User.findOne({ email: 'mahima@gmail.com' });
        if (!mahima) {
            console.log('❌ User mahima not found. Please login first.');
            process.exit(1);
        }

        console.log(`Found user: ${mahima.name}`);

        // Create sample documents
        const sampleDocs = [
            {
                title: 'Getting Started with React',
                description: 'A comprehensive guide to building modern web applications with React.js including hooks, context, and best practices.',
                status: 'Approved',
                domain: 'Frontend',
                region: 'Asia',
                tags: ['react', 'javascript', 'frontend'],
                uploader: mahima._id,
                versions: [{
                    versionNum: 1,
                    fileUrl: 'https://example.com/react-guide.pdf',
                    changelog: 'Initial version'
                }]
            },
            {
                title: 'Node.js API Development',
                description: 'Learn how to build RESTful APIs with Node.js and Express framework with MongoDB integration.',
                status: 'Approved',
                domain: 'Backend',
                region: 'Global',
                tags: ['nodejs', 'api', 'backend'],
                uploader: mahima._id,
                versions: [{
                    versionNum: 1,
                    fileUrl: 'https://example.com/nodejs-api.pdf',
                    changelog: 'Initial version'
                }]
            },
            {
                title: 'MongoDB Best Practices',
                description: 'Database design patterns and optimization techniques for MongoDB in production environments.',
                status: 'Approved',
                domain: 'Database',
                region: 'Europe',
                tags: ['mongodb', 'database', 'nosql'],
                uploader: mahima._id,
                versions: [{
                    versionNum: 1,
                    fileUrl: 'https://example.com/mongodb-best.pdf',
                    changelog: 'Initial version'
                }]
            },
            {
                title: 'CSS Grid and Flexbox Guide',
                description: 'Master modern CSS layout techniques with practical examples and responsive design patterns.',
                status: 'Approved',
                domain: 'Frontend',
                region: 'Asia',
                tags: ['css', 'layout', 'responsive'],
                uploader: mahima._id,
                versions: [{
                    versionNum: 1,
                    fileUrl: 'https://example.com/css-layout.pdf',
                    changelog: 'Initial version'
                }]
            }
        ];

        // Insert documents
        await Document.insertMany(sampleDocs);
        console.log(`✅ Created ${sampleDocs.length} sample documents`);

        // Update user score
        mahima.score += 40; // 10 points per document
        await mahima.save();
        console.log(`✅ Updated ${mahima.name}'s score to ${mahima.score}`);

        console.log('\n🎉 Sample data seeded successfully!');
        console.log('Refresh your browser to see the content.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedSampleData();
