// Wipe ALL users, messages, groups, calls, statuses from the DB
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });

async function wipeAllData() {
    try {
        const collections = [
            'users', 'messages', 'calllogs', 'groups',
            'groupmessages', 'broadcasts', 'statuses',
            'chatthemes', 'scheduledmessages', 'resetcodes'
        ];

        for (const col of collections) {
            try {
                const result = await mongoose.connection.collection(col).deleteMany({});
                console.log(`🗑️  ${col}: deleted ${result.deletedCount} documents`);
            } catch (e) {
                console.log(`⚠️  ${col}: ${e.message}`);
            }
        }

        console.log('\n✅ All data wiped — DB is clean and ready for production!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Wait for connection then run
mongoose.connection.once('open', wipeAllData);
