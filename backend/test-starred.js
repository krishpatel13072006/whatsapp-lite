const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const PRIYA_CREDENTIALS = {
  username: 'priya',
  password: 'priya123'
};

async function testStarredMessages() {
  console.log('=== Testing Starred Messages Functionality ===\n');
  
  try {
    // Step 1: Login as priya
    console.log('1. Logging in as priya...');
    const loginRes = await axios.post(`${BASE_URL}/api/login`, PRIYA_CREDENTIALS);
    const priyaToken = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('Token:', priyaToken);
    console.log();
    
    // Step 2: Get current messages
    console.log('2. Getting all messages for priya...');
    const messagesRes = await axios.get(`${BASE_URL}/api/messages/user1`, {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });
    const messages = messagesRes.data;
    console.log(`✅ Found ${messages.length} messages`);
    console.log();
    
    if (messages.length > 0) {
      // Find a message that's not already starred
      let messageToStar = null;
      for (const msg of messages) {
        console.log(`Message ${msg._id} - Starred by:`, msg.starredBy);
        if (!msg.starredBy || !msg.starredBy.includes('priya')) {
          messageToStar = msg;
          break;
        }
      }
      
      if (!messageToStar) {
        // If all messages are starred, unstar the first one and then star it
        messageToStar = messages[0];
        console.log('All messages are starred, unstarring first message:', messageToStar._id);
        const unstarRes = await axios.put(`${BASE_URL}/api/messages/${messageToStar._id}/star`, {}, {
          headers: { Authorization: `Bearer ${priyaToken}` }
        });
        console.log('✅ Unstar response:', unstarRes.data);
      }
      
      console.log('3. Starring message:', messageToStar._id);
      
      // Star the message
      const starRes = await axios.put(`${BASE_URL}/api/messages/${messageToStar._id}/star`, {}, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });
      console.log('✅ Star response:', starRes.data);
      console.log();
      
      // Get starred messages
      console.log('4. Getting starred messages...');
      const starredRes = await axios.get(`${BASE_URL}/api/messages/starred`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });
      
      const starredMessages = starredRes.data;
      console.log(`✅ Found ${starredMessages.length} starred messages`);
      
      if (starredMessages.length > 0) {
        console.log('✅ Starred messages:');
        starredMessages.forEach(msg => {
          console.log(`  - ${msg.text.substring(0, 50)}...`);
          console.log(`    From: ${msg.fromUsername}`);
          console.log(`    Starred by: ${JSON.stringify(msg.starredBy)}`);
          console.log();
        });
      } else {
        console.log('⚠️  No starred messages found');
      }
    } else {
      console.log('⚠️  No messages found to star');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

testStarredMessages();
