const axios = require('axios');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const BASE_URL = 'http://localhost:5000';
const PRIYA_CREDENTIALS = {
  username: 'priya',
  password: 'priya123'
};

async function testStarredMessages() {
  try {
    // Connect to MongoDB directly to check the data
    const uri = process.env.MONGODB_URI || 'mongodb+srv://krish:krishpatel123123@devcluster.rkrdcgt.mongodb.net/test';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('whatsapp-lite');
    const messagesCollection = db.collection('messages');
    
    console.log('=== Direct MongoDB Query ===');
    
    // Find all messages with priya in starredBy
    const messagesWithPriya = await messagesCollection.find({
      starredBy: { $elemMatch: { $eq: 'priya' } }
    }).toArray();
    console.log('Messages with priya in starredBy:', messagesWithPriya.length);
    
    if (messagesWithPriya.length > 0) {
      console.log('First message:', JSON.stringify(messagesWithPriya[0], null, 2));
    }
    
    // Find all messages where starredBy exists and is an array
    const messagesWithStarredBy = await messagesCollection.find({
      starredBy: { $exists: true, $not: { $size: 0 } }
    }).toArray();
    console.log('Messages with non-empty starredBy:', messagesWithStarredBy.length);
    
    // Check if any messages have starredBy as an array
    if (messagesWithStarredBy.length > 0) {
      console.log('First message with starredBy:', 
        JSON.stringify(messagesWithStarredBy[0].starredBy, null, 2));
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStarredMessages();
