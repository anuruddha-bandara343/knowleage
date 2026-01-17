const mongoose = require('mongoose');

// Connect to admin to list dbs
mongoose.connect('mongodb://localhost:27017/admin')
    .then(async () => {
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();

        let found = false;
        for (const dbInfo of result.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;

            const conn = mongoose.createConnection(`mongodb://localhost:27017/${dbInfo.name}`);
            const User = conn.model('User', new mongoose.Schema({ email: String }, { strict: false }));

            const user = await User.findOne({ email: 'mahima2002@gmail.com' });
            if (user) {
                console.log(`FOUND USER IN DATABASE: ${dbInfo.name}`);
                found = true;
            }
            await conn.close();
        }

        if (!found) {
            console.log('User NOT FOUND in any local database.');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
