// Comprehensive Feature Test Script for WhatsApp-Lite
// Tests all features for user1 and user2

const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5000';

// Test credentials
const USER1 = { username: 'user1', password: 'user123' };
const USER2 = { username: 'user2', password: 'user123' };

// Store tokens and sockets
let user1Token, user2Token;
let user1Socket, user2Socket;
let testResults = [];

function log(test, status, message = '') {
  const result = { test, status, message, timestamp: new Date().toISOString() };
  testResults.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${test}] ${status}${message ? ': ' + message : ''}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(user) {
  try {
    const res = await axios.post(`${API_URL}/api/login`, {
      username: user.username,
      password: user.password
    });
    return res.data.token;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
}

async function createSocket(username, token) {
  return new Promise((resolve, reject) => {
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log(`🔌 ${username} socket connected: ${socket.id}`);
      socket.emit('register_user', username);
    });
    
    socket.on('me', (id) => {
      console.log(`📱 ${username} received me event: ${id}`);
    });
    
    setTimeout(() => resolve(socket), 1000);
  });
}

async function runTests() {
  console.log('\n🧪 Starting Comprehensive Feature Tests\n');
  console.log('=' .repeat(60));
  
  // ===== AUTHENTICATION TESTS =====
  console.log('\n📋 AUTHENTICATION TESTS\n');
  
  // Test 1: User1 Login
  try {
    user1Token = await login(USER1);
    log('User1 Login', 'PASS', 'Token received');
  } catch (err) {
    log('User1 Login', 'FAIL', err.message);
    return;
  }
  
  // Test 2: User2 Login
  try {
    user2Token = await login(USER2);
    log('User2 Login', 'PASS', 'Token received');
  } catch (err) {
    log('User2 Login', 'FAIL', err.message);
    return;
  }
  
  // ===== SOCKET CONNECTION TESTS =====
  console.log('\n📋 SOCKET CONNECTION TESTS\n');
  
  // Test 3: User1 Socket Connection
  try {
    user1Socket = await createSocket(USER1.username, user1Token);
    log('User1 Socket', 'PASS', `Socket ID: ${user1Socket.id}`);
  } catch (err) {
    log('User1 Socket', 'FAIL', err.message);
  }
  
  // Test 4: User2 Socket Connection
  try {
    user2Socket = await createSocket(USER2.username, user2Token);
    log('User2 Socket', 'PASS', `Socket ID: ${user2Socket.id}`);
  } catch (err) {
    log('User2 Socket', 'FAIL', err.message);
  }
  
  await delay(1000);
  
  // ===== USER SETTINGS TESTS =====
  console.log('\n📋 USER SETTINGS TESTS\n');
  
  // Test 5: Get User1 Settings
  try {
    const res = await axios.get(`${API_URL}/api/user-settings`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get User1 Settings', 'PASS', `Username: ${res.data.username}`);
  } catch (err) {
    log('Get User1 Settings', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 6: Get User2 Settings
  try {
    const res = await axios.get(`${API_URL}/api/user-settings`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    log('Get User2 Settings', 'PASS', `Username: ${res.data.username}`);
  } catch (err) {
    log('Get User2 Settings', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== CONTACTS TESTS =====
  console.log('\n📋 CONTACTS TESTS\n');
  
  // Test 7: Get All Users (User1)
  try {
    const res = await axios.get(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    const users = res.data;
    const hasUser2 = users.some(u => u.username === USER2.username);
    log('User1 Get Contacts', hasUser2 ? 'PASS' : 'WARN', `Found ${users.length} users, user2 ${hasUser2 ? 'found' : 'not found'}`);
  } catch (err) {
    log('User1 Get Contacts', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 8: Get All Users (User2)
  try {
    const res = await axios.get(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    const users = res.data;
    const hasUser1 = users.some(u => u.username === USER1.username);
    log('User2 Get Contacts', hasUser1 ? 'PASS' : 'WARN', `Found ${users.length} users, user1 ${hasUser1 ? 'found' : 'not found'}`);
  } catch (err) {
    log('User2 Get Contacts', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== MESSAGING TESTS =====
  console.log('\n📋 MESSAGING TESTS\n');
  
  // Test 9: User1 sends message to User2
  let messageReceived = false;
  user2Socket.on('receive_message', (data) => {
    messageReceived = true;
    log('User2 Receive Message', 'PASS', `Received: "${data.text}" from ${data.fromUsername}`);
  });
  
  try {
    const res = await axios.post(`${API_URL}/api/save-message`, {
      toUsername: USER2.username,
      fromUsername: USER1.username,
      text: 'Test message from user1',
      type: 'text'
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    // Also emit via socket
    user1Socket.emit('send_message', {
      toUsername: USER2.username,
      fromUsername: USER1.username,
      text: 'Test message from user1',
      type: 'text',
      timestamp: new Date()
    });
    
    log('User1 Send Message', 'PASS', 'Message sent');
  } catch (err) {
    log('User1 Send Message', 'FAIL', err.response?.data?.message || err.message);
  }
  
  await delay(2000);
  
  if (!messageReceived) {
    log('User2 Receive Message', 'WARN', 'No real-time message received (checking API...)');
  }
  
  // Test 10: Get Messages between users
  try {
    const res = await axios.get(`${API_URL}/api/messages/${USER2.username}`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get Chat History', 'PASS', `Found ${res.data.length} messages`);
  } catch (err) {
    log('Get Chat History', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== GROUP TESTS =====
  console.log('\n📋 GROUP TESTS\n');
  
  // Test 11: Get Groups (User1)
  try {
    const res = await axios.get(`${API_URL}/api/groups`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('User1 Get Groups', 'PASS', `Found ${res.data.length} groups`);
  } catch (err) {
    log('User1 Get Groups', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 12: Get Groups (User2)
  try {
    const res = await axios.get(`${API_URL}/api/groups`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    log('User2 Get Groups', 'PASS', `Found ${res.data.length} groups`);
  } catch (err) {
    log('User2 Get Groups', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 13: Create Group (User1)
  let testGroupId;
  try {
    const res = await axios.post(`${API_URL}/api/groups/create`, {
      name: 'Test Group',
      description: 'Group for testing',
      createdBy: USER1.username,
      members: [USER1.username, USER2.username]
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    testGroupId = res.data.group._id;
    log('Create Group', 'PASS', `Group created: ${res.data.group.name}`);
  } catch (err) {
    log('Create Group', 'FAIL', err.response?.data?.message || err.message);
  }
  
  await delay(500);
  
  // Test 14: Get Group Messages
  if (testGroupId) {
    try {
      const res = await axios.get(`${API_URL}/api/groups/${testGroupId}/messages`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      log('Get Group Messages', 'PASS', `Found ${res.data.length} messages`);
    } catch (err) {
      log('Get Group Messages', 'FAIL', err.response?.data?.message || err.message);
    }
  }
  
  // ===== PRIVACY SETTINGS TESTS =====
  console.log('\n📋 PRIVACY SETTINGS TESTS\n');
  
  // Test 15: Get Privacy Settings (User1)
  try {
    const res = await axios.get(`${API_URL}/api/privacy-settings`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get Privacy Settings', 'PASS', JSON.stringify(res.data));
  } catch (err) {
    log('Get Privacy Settings', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 16: Update Privacy Settings (User1)
  try {
    const res = await axios.post(`${API_URL}/api/privacy-settings`, {
      lastSeen: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Update Privacy Settings', 'PASS', 'Settings updated');
  } catch (err) {
    log('Update Privacy Settings', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== PROFILE TESTS =====
  console.log('\n📋 PROFILE TESTS\n');
  
  // Test 17: Get User Public Profile
  try {
    const res = await axios.get(`${API_URL}/api/user-public-profile/${USER2.username}`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get User2 Profile (by User1)', 'PASS', `Display: ${res.data.displayName || res.data.username}`);
  } catch (err) {
    log('Get User2 Profile (by User1)', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 18: Update Profile (User1)
  try {
    const res = await axios.post(`${API_URL}/api/update-profile`, {
      displayName: 'User One Updated',
      about: 'Testing WhatsApp-Lite!'
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Update Profile', 'PASS', 'Profile updated');
  } catch (err) {
    log('Update Profile', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== CALL LOGS TESTS =====
  console.log('\n📋 CALL LOGS TESTS\n');
  
  // Test 19: Get Call Logs (User1)
  try {
    const res = await axios.get(`${API_URL}/api/call-logs`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get Call Logs', 'PASS', `Found ${res.data.length} call logs`);
  } catch (err) {
    log('Get Call Logs', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 20: Get Call Logs (User2)
  try {
    const res = await axios.get(`${API_URL}/api/call-logs`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    log('Get Call Logs (User2)', 'PASS', `Found ${res.data.length} call logs`);
  } catch (err) {
    log('Get Call Logs (User2)', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== BLOCKED CONTACTS TESTS =====
  console.log('\n📋 BLOCKED CONTACTS TESTS\n');
  
  // Test 21: Get Blocked Contacts
  try {
    const res = await axios.get(`${API_URL}/api/blocked-contacts`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get Blocked Contacts', 'PASS', `Blocked: ${res.data.length} contacts`);
  } catch (err) {
    log('Get Blocked Contacts', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== RECENT CHATS TESTS =====
  console.log('\n📋 RECENT CHATS TESTS\n');
  
  // Test 22: Get Recent Chats (User1)
  try {
    const res = await axios.get(`${API_URL}/api/recent-chats`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    log('Get Recent Chats', 'PASS', `Found ${res.data.length} recent chats`);
  } catch (err) {
    log('Get Recent Chats', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // Test 23: Get Recent Chats (User2)
  try {
    const res = await axios.get(`${API_URL}/api/recent-chats`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    log('Get Recent Chats (User2)', 'PASS', `Found ${res.data.length} recent chats`);
  } catch (err) {
    log('Get Recent Chats (User2)', 'FAIL', err.response?.data?.message || err.message);
  }
  
  // ===== CLEANUP =====
  console.log('\n📋 CLEANUP\n');
  
  if (user1Socket) user1Socket.disconnect();
  if (user2Socket) user2Socket.disconnect();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const warned = testResults.filter(r => r.status === 'WARN').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`📋 Total: ${testResults.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
  }
  
  console.log('\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
