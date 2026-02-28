const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const BASE_URL = 'http://localhost:5000';
const PRIYA_CREDENTIALS = {
  username: 'priya',
  password: 'priya123'
};

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    const loginRes = await axios.post(`${BASE_URL}/api/login`, PRIYA_CREDENTIALS, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Login successful');
    console.log('Token received:', loginRes.data.token);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

testLogin();
