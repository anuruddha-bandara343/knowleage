const mongoose = require('mongoose');

// Connect to admin to list dbs
mongoose.connect('mongodb://localhost:27017/admin')
    .then(async () => {
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();
        console.log('Databases:', result.databases.map(d => d.name));

        for (const dbInfo of result.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;

            console.log(`\nChecking DB: ${dbInfo.name}`);
            const conn = mongoose.createConnection(`mongodb://localhost:27017/${dbInfo.name}`);
            const User = conn.model('User', new mongoose.Schema({}, { strict: false }));
            const count = await User.countDocuments();
            console.log(`  Users count: ${count}`);

            if (count > 0) {
                const users = await User.find({}, 'name email role').limit(5);
                console.log('  Sample Users:', users);
            }
            await conn.close();
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
