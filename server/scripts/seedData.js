const mongoose = require('mongoose');
const User = require('../models/User');
const Document = require('../models/Document');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dkn-system';

const usersToSeed = [
    {
        name: 'John Consultant',
        email: 'consultant@dkn.com',
        role: 'Consultant',
        department: 'Engineering'
    },
    {
        name: 'Sarah Senior',
        email: 'senior@dkn.com',
        role: 'SeniorConsultant',
        department: 'Engineering'
    },
    {
        name: 'Mike Champion',
        email: 'champion@dkn.com',
        role: 'KnowledgeChampion',
        department: 'HR'
    },
    {
        name: 'Alice Governance',
        email: 'governance@dkn.com',
        role: 'KnowledgeGovernanceCouncil',
        department: 'Compliance'
    },
    {
        name: 'Bob IT',
        email: 'it@dkn.com',
        role: 'ITInfrastructure',
        department: 'IT'
    },
    {
        name: 'Admin User',
        email: 'admin@dkn.com',
        role: 'Admin',
        department: 'IT'
    }
];

// Add the missing user identified in the error logs earlier if different
const missingUser = {
    _id: "694ea1c8b7b23cff006f1570",
    name: "Legacy User",
    email: "legacy@dkn.com",
    role: "Admin",
    department: "System"
};

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing users? Maybe check first.
        // For this task, we want to ensure these users exist.

        // Upsert users
        for (const u of usersToSeed) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
                console.log(`Created user: ${u.name} (${u.role})`);
            } else {
                console.log(`User already exists: ${u.name}`);
            }
        }

        // Try to create the missing user with specific ID
        try {
            const exists = await User.findById(missingUser._id);
            if (!exists) {
                // Must force ID
                const u = new User(missingUser);
                u._id = missingUser._id; // Force ID if possible, though Mongoose heavily manages _id.
                // Better to use create with _id if schema allows it or updateOne with upsert
                await User.updateOne(
                    { _id: missingUser._id },
                    { $set: missingUser },
                    { upsert: true }
                );
                console.log(`Restored missing legacy user: ${missingUser._id}`);
            }
        } catch (e) {
            console.error("Could not restore legacy user with specific ID", e);
        }

        console.log('✅ Seeding complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedDB();
