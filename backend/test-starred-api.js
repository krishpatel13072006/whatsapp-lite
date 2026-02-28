require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testStarredAPI() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/login`, {
      username: 'priya',
      password: 'priya123'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in\n');

    // Call starred messages endpoint
    console.log('2. Calling /api/messages/starred...');
    const starredRes = await axios.get(`${BASE_URL}/api/messages/starred`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Response status:', starredRes.status);
    console.log('Response data keys:', Object.keys(starredRes.data));
    console.log('Response data:', JSON.stringify(starredRes.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testStarredAPI();
