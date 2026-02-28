const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const BASE_URL = 'http://localhost:5000';
const PRIYA_CREDENTIALS = {
  username: 'priya',
  password: 'priya123'
};

async function testStarredEndpoint() {
  try {
    console.log('=== Testing Starred Messages Endpoint ===');
    
    // Step 1: Login as priya
    console.log('1. Logging in as priya...');
    const loginRes = await axios.post(`${BASE_URL}/api/login`, PRIYA_CREDENTIALS);
    const priyaToken = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('Token:', priyaToken);
    console.log();
    
    // Step 2: Call starred messages endpoint
    console.log('2. Calling starred messages endpoint...');
    const starredRes = await axios.get(`${BASE_URL}/api/messages/starred`, {
      headers: { 
        Authorization: `Bearer ${priyaToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Starred endpoint response status:', starredRes.status);
    console.log('✅ Starred endpoint response data:', JSON.stringify(starredRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.request) {
      console.error('❌ No response received from server');
    }
    console.error('❌ Error message:', error.message);
  }
}

testStarredEndpoint();
