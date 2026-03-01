require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDB() {
    try {
        const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-clone';
        console.log('Connecting to MongoDB...', MONGODB_URI);

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });
        console.log('Connected to MongoDB successfully.');

        const db = mongoose.connection.db;
        const usernames = ['priya_pacnahl', 'angel_priya'];

        // Delete Users
        const usersResult = await db.collection('users').deleteMany({ username: { $in: usernames } });
        console.log(`Deleted ${usersResult.deletedCount} users.`);

        // Delete Messages (from)
        const msgFromResult = await db.collection('messages').deleteMany({ fromUsername: { $in: usernames } });
        console.log(`Deleted ${msgFromResult.deletedCount} messages from target users.`);

        // Delete Messages (to)
        const msgToResult = await db.collection('messages').deleteMany({ toUsername: { $in: usernames } });
        console.log(`Deleted ${msgToResult.deletedCount} messages to target users.`);

        // Pull from contacts/friends arrays if they exist in users collection
        // (A generic pull on any document where these usernames might be in an array)
        // In this app it seems like there is no defined "friends" array per user according to Mongoose.

        console.log('Cleanup finished.');

    } catch (error) {
        console.error('Error during cleanup:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
}

cleanDB();
