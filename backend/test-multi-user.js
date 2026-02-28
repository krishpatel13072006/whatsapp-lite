/**
 * Comprehensive Multi-User Feature Test Script
 * Tests all 20 features for ANY user in the WhatsApp-Lite application
 * 
 * Usage: node test-multi-user.js <username> <password>
 * Example: node test-multi-user.js john password123
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test configuration
const config = {
  username: process.argv[2] || 'testuser',
  password: process.argv[3] || 'password123',
  testRecipient: 'user1', // Default user to test messaging with
};

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logResult(feature, status, message, details = null) {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${feature}: ${message}`);
  results.tests.push({ feature, status, message, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n========================================');
  console.log(`🧪 Testing Features for User: ${config.username}`);
  console.log('========================================\n');

  let token = null;
  let userId = null;

  // ============================================
  // 1. AUTHENTICATION SYSTEM
  // ============================================
  console.log('\n--- 1. Authentication System ---');
  
  try {
    // Test registration (may fail if user exists)
    const registerRes = await axios.post(`${API_URL}/register`, {
      username: config.username,
      password: config.password,
      email: `${config.username}@test.com`
    });
    logResult('Registration', 'PASS', 'User registered successfully');
  } catch (err) {
    if (err.response?.status === 400) {
      logResult('Registration', 'PASS', 'User already exists (expected for existing users)');
    } else {
      logResult('Registration', 'FAIL', `Registration error: ${err.message}`);
    }
  }

  try {
    // Test login
    const loginRes = await axios.post(`${API_URL}/login`, {
      username: config.username,
      password: config.password
    });
    token = loginRes.data.token;
    userId = loginRes.data.username;
    logResult('Login', 'PASS', `Logged in as ${userId}`);
  } catch (err) {
    logResult('Login', 'FAIL', `Login failed: ${err.response?.data?.message || err.message}`);
    console.log('\n❌ Cannot continue tests without authentication');
    process.exit(1);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ============================================
  // 2. USER PROFILE
  // ============================================
  console.log('\n--- 2. User Profile ---');

  try {
    const profileRes = await axios.get(`${API_URL}/user-settings`, { headers: authHeaders });
    logResult('Profile Settings', 'PASS', `Retrieved settings for ${config.username}`);
  } catch (err) {
    logResult('Profile Settings', 'FAIL', `Failed to get settings: ${err.message}`);
  }

  try {
    const updateRes = await axios.post(`${API_URL}/update-profile`, 
      { displayName: `Test User ${config.username}`, about: 'Testing WhatsApp-Lite!' },
      { headers: authHeaders }
    );
    logResult('Profile Update', 'PASS', 'Profile updated successfully');
  } catch (err) {
    logResult('Profile Update', 'FAIL', `Failed to update profile: ${err.message}`);
  }

  // ============================================
  // 3. CONTACTS
  // ============================================
  console.log('\n--- 3. Contacts ---');

  let contacts = [];
  try {
    const contactsRes = await axios.get(`${API_URL}/all-users`, { headers: authHeaders });
    contacts = contactsRes.data || [];
    logResult('Contacts List', 'PASS', `Found ${contacts.length} users`);
  } catch (err) {
    logResult('Contacts List', 'FAIL', `Failed to get users: ${err.message}`);
  }

  // ============================================
  // 4. RECENT CHATS
  // ============================================
  console.log('\n--- 4. Recent Chats ---');

  try {
    const recentRes = await axios.get(`${API_URL}/recent-chats`, { headers: authHeaders });
    const recentChats = recentRes.data || [];
    logResult('Recent Chats', 'PASS', `Found ${recentChats.length} recent chats`);
  } catch (err) {
    logResult('Recent Chats', 'FAIL', `Failed to get recent chats: ${err.message}`);
  }

  // ============================================
  // 5. MESSAGING
  // ============================================
  console.log('\n--- 5. Messaging ---');

  let testMessageId = null;
  try {
    const messageRes = await axios.post(`${API_URL}/save-message`, {
      toUsername: config.testRecipient,
      text: `Test message from ${config.username} at ${new Date().toISOString()}`
    }, { headers: authHeaders });
    testMessageId = messageRes.data.message?._id || messageRes.data._id;
    logResult('Send Message', 'PASS', `Message sent to ${config.testRecipient}`);
  } catch (err) {
    logResult('Send Message', 'FAIL', `Failed to send message: ${err.message}`);
  }

  try {
    const messagesRes = await axios.get(`${API_URL}/messages/${config.testRecipient}`, { headers: authHeaders });
    const messages = messagesRes.data || [];
    logResult('Load Messages', 'PASS', `Loaded ${messages.length} messages with ${config.testRecipient}`);
  } catch (err) {
    logResult('Load Messages', 'FAIL', `Failed to load messages: ${err.message}`);
  }

  // ============================================
  // 6. STARRED MESSAGES
  // ============================================
  console.log('\n--- 6. Starred Messages ---');

  if (testMessageId) {
    try {
      const starRes = await axios.put(`${API_URL}/messages/${testMessageId}/star`, {}, { headers: authHeaders });
      logResult('Star Message', 'PASS', 'Message starred successfully');
    } catch (err) {
      logResult('Star Message', 'FAIL', `Failed to star message: ${err.message}`);
    }
  } else {
    logResult('Star Message', 'WARN', 'No message ID to test starring');
  }

  try {
    const starredRes = await axios.get(`${API_URL}/messages/starred`, { headers: authHeaders });
    const starred = starredRes.data || [];
    logResult('Get Starred', 'PASS', `Found ${starred.length} starred messages`);
  } catch (err) {
    logResult('Get Starred', 'FAIL', `Failed to get starred messages: ${err.message}`);
  }

  // ============================================
  // 7. SEARCH
  // ============================================
  console.log('\n--- 7. Search ---');

  try {
    const searchRes = await axios.get(`${API_URL}/messages/search?q=test`, { headers: authHeaders });
    const results = searchRes.data || [];
    logResult('Message Search', 'PASS', `Found ${results.length} messages matching "test"`);
  } catch (err) {
    logResult('Message Search', 'FAIL', `Search failed: ${err.message}`);
  }

  // ============================================
  // 8. GROUPS
  // ============================================
  console.log('\n--- 8. Groups ---');

  let testGroupId = null;
  try {
    const groupsRes = await axios.get(`${API_URL}/groups`, { headers: authHeaders });
    const groups = groupsRes.data || [];
    if (groups.length > 0) {
      testGroupId = groups[0]._id;
    }
    logResult('Get Groups', 'PASS', `Found ${groups.length} groups`);
  } catch (err) {
    logResult('Get Groups', 'FAIL', `Failed to get groups: ${err.message}`);
  }

  try {
    const createGroupRes = await axios.post(`${API_URL}/groups/create`, {
      name: `${config.username}'s Test Group ${Date.now()}`,
      members: [config.testRecipient]
    }, { headers: authHeaders });
    testGroupId = createGroupRes.data._id;
    logResult('Create Group', 'PASS', `Created group: ${createGroupRes.data.name}`);
  } catch (err) {
    if (err.response?.data?.message?.includes('already exists')) {
      logResult('Create Group', 'PASS', 'Group creation works (group exists)');
    } else {
      logResult('Create Group', 'FAIL', `Failed to create group: ${err.message}`);
    }
  }

  if (testGroupId) {
    try {
      const groupMsgRes = await axios.post(`${API_URL}/groups/${testGroupId}/messages`, {
        text: `Test group message from ${config.username}`
      }, { headers: authHeaders });
      logResult('Group Message', 'PASS', 'Sent message to group');
    } catch (err) {
      logResult('Group Message', 'FAIL', `Failed to send group message: ${err.message}`);
    }
  }

  // ============================================
  // 9. FILE UPLOAD
  // ============================================
  console.log('\n--- 9. File Upload ---');

  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    
    // Create a test file
    const testFilePath = path.join(__dirname, `test-upload-${Date.now()}.txt`);
    fs.writeFileSync(testFilePath, `Test file from ${config.username}`);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    
    const uploadRes = await axios.post(`${API_URL}/upload-file`, formData, {
      headers: {
        ...authHeaders,
        ...formData.getHeaders()
      }
    });
    
    // Cleanup test file
    fs.unlinkSync(testFilePath);
    
    logResult('File Upload', 'PASS', `File uploaded: ${uploadRes.data.filename}`);
  } catch (err) {
    logResult('File Upload', 'FAIL', `File upload failed: ${err.message}`);
  }

  // ============================================
  // 10. BROADCASTS
  // ============================================
  console.log('\n--- 10. Broadcasts ---');

  let testBroadcastId = null;
  try {
    const broadcastsRes = await axios.get(`${API_URL}/broadcasts`, { headers: authHeaders });
    const broadcasts = broadcastsRes.data || [];
    if (broadcasts.length > 0) {
      testBroadcastId = broadcasts[0]._id;
    }
    logResult('Get Broadcasts', 'PASS', `Found ${broadcasts.length} broadcasts`);
  } catch (err) {
    logResult('Get Broadcasts', 'FAIL', `Failed to get broadcasts: ${err.message}`);
  }

  try {
    const createBroadcastRes = await axios.post(`${API_URL}/broadcasts/create`, {
      name: `${config.username}'s Test Broadcast ${Date.now()}`,
      recipients: [config.testRecipient]
    }, { headers: authHeaders });
    testBroadcastId = createBroadcastRes.data._id;
    logResult('Create Broadcast', 'PASS', `Created broadcast: ${createBroadcastRes.data.name}`);
  } catch (err) {
    logResult('Create Broadcast', 'WARN', `Broadcast creation: ${err.response?.data?.message || err.message}`);
  }

  // ============================================
  // 11. PRIVACY SETTINGS
  // ============================================
  console.log('\n--- 11. Privacy Settings ---');

  try {
    const privacyRes = await axios.get(`${API_URL}/privacy-settings`, { headers: authHeaders });
    logResult('Get Privacy', 'PASS', 'Retrieved privacy settings');
  } catch (err) {
    logResult('Get Privacy', 'FAIL', `Failed to get privacy settings: ${err.message}`);
  }

  try {
    const updatePrivacyRes = await axios.post(`${API_URL}/privacy-settings`, {
      lastSeen: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true
    }, { headers: authHeaders });
    logResult('Update Privacy', 'PASS', 'Privacy settings updated');
  } catch (err) {
    logResult('Update Privacy', 'FAIL', `Failed to update privacy: ${err.message}`);
  }

  // ============================================
  // 12. BLOCKED CONTACTS
  // ============================================
  console.log('\n--- 12. Blocked Contacts ---');

  try {
    const blockedRes = await axios.get(`${API_URL}/blocked-contacts`, { headers: authHeaders });
    const blocked = blockedRes.data || [];
    logResult('Get Blocked', 'PASS', `Found ${blocked.length} blocked contacts`);
  } catch (err) {
    logResult('Get Blocked', 'FAIL', `Failed to get blocked contacts: ${err.message}`);
  }

  // ============================================
  // 13. CALL LOGS
  // ============================================
  console.log('\n--- 13. Call Logs ---');

  try {
    const callsRes = await axios.get(`${API_URL}/call-logs`, { headers: authHeaders });
    const calls = callsRes.data || [];
    logResult('Call History', 'PASS', `Found ${calls.length} call logs`);
  } catch (err) {
    logResult('Call History', 'FAIL', `Failed to get call logs: ${err.message}`);
  }

  // ============================================
  // 14. ONLINE STATUS
  // ============================================
  console.log('\n--- 14. Online Status ---');

  try {
    // Use public profile endpoint which includes online status
    const statusRes = await axios.get(`${API_URL}/user-public-profile/${config.testRecipient}`, { headers: authHeaders });
    const isOnline = statusRes.data?.isOnline;
    const lastSeen = statusRes.data?.lastSeen;
    logResult('User Status', 'PASS', `Got status for ${config.testRecipient} (online: ${isOnline})`);
  } catch (err) {
    logResult('User Status', 'FAIL', `Failed to get user status: ${err.message}`);
  }

  // ============================================
  // 15. PUBLIC PROFILE
  // ============================================
  console.log('\n--- 15. Public Profile ---');

  try {
    const profileRes = await axios.get(`${API_URL}/user-public-profile/${config.testRecipient}`, { headers: authHeaders });
    logResult('Public Profile', 'PASS', `Retrieved public profile for ${config.testRecipient}`);
  } catch (err) {
    logResult('Public Profile', 'FAIL', `Failed to get public profile: ${err.message}`);
  }

  // ============================================
  // 16. UNREAD COUNTS
  // ============================================
  console.log('\n--- 16. Unread Counts ---');

  try {
    const unreadRes = await axios.get(`${API_URL}/unread-counts`, { headers: authHeaders });
    const counts = unreadRes.data || {};
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    logResult('Unread Counts', 'PASS', `Total unread: ${total}`);
  } catch (err) {
    logResult('Unread Counts', 'FAIL', `Failed to get unread counts: ${err.message}`);
  }

  // ============================================
  // 17. CHAT THEME
  // ============================================
  console.log('\n--- 17. Chat Theme ---');

  try {
    const themeRes = await axios.get(`${API_URL}/chat/theme/${config.testRecipient}`, { headers: authHeaders });
    logResult('Get Theme', 'PASS', 'Retrieved chat theme');
  } catch (err) {
    logResult('Get Theme', 'FAIL', `Failed to get chat theme: ${err.message}`);
  }

  try {
    const setThemeRes = await axios.post(`${API_URL}/chat/theme`, {
      chatWith: config.testRecipient,
      wallpaper: 'default'
    }, { headers: authHeaders });
    logResult('Set Theme', 'PASS', 'Chat theme updated');
  } catch (err) {
    logResult('Set Theme', 'FAIL', `Failed to set chat theme: ${err.message}`);
  }

  // ============================================
  // 18. ALL MESSAGES (Export)
  // ============================================
  console.log('\n--- 18. Export All Messages ---');

  try {
    const allMsgRes = await axios.get(`${API_URL}/all-messages`, { headers: authHeaders });
    const allMsgs = allMsgRes.data || [];
    logResult('All Messages', 'PASS', `Total messages: ${allMsgs.length}`);
  } catch (err) {
    logResult('All Messages', 'FAIL', `Failed to get all messages: ${err.message}`);
  }

  // ============================================
  // 19. SCHEDULED MESSAGES
  // ============================================
  console.log('\n--- 19. Scheduled Messages ---');

  try {
    const scheduledRes = await axios.get(`${API_URL}/messages/scheduled`, { headers: authHeaders });
    const scheduled = scheduledRes.data || [];
    logResult('Scheduled Msgs', 'PASS', `Found ${scheduled.length} scheduled messages`);
  } catch (err) {
    logResult('Scheduled Msgs', 'FAIL', `Failed to get scheduled messages: ${err.message}`);
  }

  // ============================================
  // 20. WALLPAPER
  // ============================================
  console.log('\n--- 20. Wallpaper ---');

  try {
    const wallpaperRes = await axios.post(`${API_URL}/update-wallpaper`, {
      wallpaper: 'default'
    }, { headers: authHeaders });
    logResult('Update Wallpaper', 'PASS', 'Wallpaper updated');
  } catch (err) {
    logResult('Update Wallpaper', 'FAIL', `Failed to update wallpaper: ${err.message}`);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.warnings}`);
  console.log('========================================\n');

  if (results.failed === 0) {
    console.log('🎉 All critical tests passed! The application is working correctly for this user.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the results above.\n');
  }

  return results;
}

// Run tests
runTests().catch(err => {
  console.error('❌ Test suite error:', err.message);
  process.exit(1);
});
