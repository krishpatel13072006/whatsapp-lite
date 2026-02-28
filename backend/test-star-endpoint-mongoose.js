const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const BASE_URL = 'http://localhost:5000';
const PRIYA_CREDENTIALS = {
  username: 'priya',
  password: 'priya123'
};

// Import Message model
const Message = require('./src/models/Message');

async function testStarEndpoint() {
  try {
    // Connect to MongoDB using Mongoose
    const uri = process.env.MONGO_URI || 'mongodb+srv://krish:krishpatel123123@devcluster.rkrdcgt.mongodb.net/whatsapp_lite';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
    
    console.log('=== Testing Star Endpoint ===');
    
    // Step 1: Login as priya
    console.log('1. Logging in as priya...');
    const loginRes = await axios.post(`${BASE_URL}/api/login`, PRIYA_CREDENTIALS);
    const priyaToken = loginRes.data.token;
    console.log('✅ Login successful');
    console.log();
    
    // Step 2: Create a new test message
    console.log('2. Creating a new test message...');
    const createRes = await axios.post(`${BASE_URL}/api/save-message`, {
      toUsername: 'user1',
      text: 'Test message to star',
      type: 'text'
    }, {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });
    
    const messageId = createRes.data.messageId;
    console.log('✅ Message created:', messageId);
    console.log();
    
    // Step 3: Star the message
    console.log('3. Starring the message...');
    const starRes = await axios.put(`${BASE_URL}/api/messages/${messageId}/star`, {}, {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });
    
    console.log('✅ Star response:', starRes.data);
    console.log();
    
    // Step 4: Check the message in database
    console.log('4. Checking message in database...');
    const messageFromDb = await Message.findById(messageId);
    
    console.log('Message from DB:', JSON.stringify(messageFromDb, null, 2));
    
    // Step 5: Check if starred messages endpoint finds it
    console.log('5. Checking starred messages endpoint...');
    const starredRes = await axios.get(`${BASE_URL}/api/messages/starred`, {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });
    
    console.log('Starred messages found:', starredRes.data.length);
    console.log('Starred messages:', starredRes.data);
    
    // Step 6: Debug - check all messages in database
    console.log('6. Debug - checking all messages in database...');
    const allMessages = await Message.find({});
    console.log('All messages in DB:', allMessages.length);
    allMessages.forEach(msg => {
      console.log(`- ${msg._id}: ${msg.text} (from: ${msg.fromUsername}, starredBy: ${JSON.stringify(msg.starredBy)})`);
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

testStarEndpoint();
