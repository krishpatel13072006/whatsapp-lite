const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test data
const testUsers = [
  { username: 'testuser1', password: 'Test123!', email: 'test1@test.com', phoneNumber: '1234567890' },
  { username: 'testuser2', password: 'Test123!', email: 'test2@test.com', phoneNumber: '1234567891' },
  { username: 'testuser3', password: 'Test123!', email: 'test3@test.com', phoneNumber: '1234567892' }
];

let tokens = {};
let userIds = {};
let testGroupId = null;
let testMessageId = null;

// Helper function for API calls
async function apiCall(method, endpoint, data, token = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data
  };
  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testRegister(user) {
  console.log(`\n📝 Testing Registration for ${user.username}...`);
  const result = await apiCall('post', '/api/register', user);
  if (result.success) {
    console.log(`✅ Registration successful: ${user.username}`);
    // Registration doesn't return token, need to login
    return await testLogin(user);
  } else {
    // If user already exists, try login
    if (result.error?.message?.includes('already exists')) {
      console.log(`⚠️ User ${user.username} already exists, trying login...`);
      return await testLogin(user);
    }
    console.log(`❌ Registration failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testLogin(user) {
  console.log(`\n🔐 Testing Login for ${user.username}...`);
  const result = await apiCall('post', '/api/login', { username: user.username, password: user.password });
  if (result.success) {
    console.log(`✅ Login successful: ${user.username}`);
    tokens[user.username] = result.data.token;
    return true;
  } else {
    console.log(`❌ Login failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testGetUsers(token, username) {
  console.log(`\n👥 Testing Get Users for ${username}...`);
  const result = await apiCall('get', '/api/users', null, token);
  if (result.success) {
    console.log(`✅ Got ${result.data.length} users`);
    result.data.forEach(u => {
      console.log(`   - ${u.username} (${u.displayName || 'no display name'})`);
      if (!u.username) console.log(`   ⚠️ WARNING: User missing username!`);
    });
    return result.data;
  } else {
    console.log(`❌ Get users failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function testGetRecentChats(token, username) {
  console.log(`\n💬 Testing Get Recent Chats for ${username}...`);
  const result = await apiCall('get', '/api/recent-chats', null, token);
  if (result.success) {
    console.log(`✅ Got ${result.data.length} recent chats`);
    return result.data;
  } else {
    console.log(`❌ Get recent chats failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function testGetUserSettings(token, username) {
  console.log(`\n⚙️ Testing Get User Settings for ${username}...`);
  const result = await apiCall('get', '/api/user-settings', null, token);
  if (result.success) {
    console.log(`✅ Got user settings:`);
    console.log(`   - Wallpaper: ${result.data.wallpaper}`);
    console.log(`   - Display Name: ${result.data.displayName}`);
    console.log(`   - About: ${result.data.about}`);
    return result.data;
  } else {
    console.log(`❌ Get user settings failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testUpdateProfile(token, username) {
  console.log(`\n✏️ Testing Update Profile for ${username}...`);
  const result = await apiCall('post', '/api/update-profile', {
    displayName: `${username} Display`,
    about: 'Testing WhatsApp Lite!'
  }, token);
  if (result.success) {
    console.log(`✅ Profile updated successfully`);
    return true;
  } else {
    console.log(`❌ Update profile failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testCreateGroup(token, username) {
  console.log(`\n👥 Testing Create Group by ${username}...`);
  const members = Object.keys(tokens).filter(u => u !== username);
  const result = await apiCall('post', '/api/groups/create', {
    name: 'Test Group',
    description: 'A test group for testing',
    members: members
  }, token);
  if (result.success) {
    console.log(`✅ Group created: ${result.data.group.name} (${result.data.group._id})`);
    testGroupId = result.data.group._id;
    return result.data.group;
  } else {
    console.log(`❌ Create group failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testGetGroups(token, username) {
  console.log(`\n📋 Testing Get Groups for ${username}...`);
  const result = await apiCall('get', '/api/groups', null, token);
  if (result.success) {
    console.log(`✅ Got ${result.data.length} groups`);
    result.data.forEach(g => {
      console.log(`   - ${g.name} (${g._id}) - ${g.members?.length || 0} members`);
    });
    return result.data;
  } else {
    console.log(`❌ Get groups failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function testSendMessage(token, from, to) {
  console.log(`\n📨 Testing Send Message from ${from} to ${to}...`);
  // Messages are sent via socket.io, not REST API
  // We'll create a test message directly in the database for testing
  console.log(`⚠️ Messages are sent via socket.io, skipping REST API test`);
  return null;
}

async function testGetMessages(token, username, otherUsername) {
  console.log(`\n📬 Testing Get Messages between ${username} and ${otherUsername}...`);
  const result = await apiCall('get', `/api/messages/${otherUsername}`, null, token);
  if (result.success) {
    console.log(`✅ Got ${result.data.length} messages`);
    return result.data;
  } else {
    console.log(`❌ Get messages failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function testStarMessage(token, messageId) {
  console.log(`\n⭐ Testing Star Message...`);
  const result = await apiCall('put', `/api/messages/${messageId}/star`, {}, token);
  if (result.success) {
    console.log(`✅ Message starred: ${result.data.starred}`);
    return result.data;
  } else {
    console.log(`❌ Star message failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testGetStarredMessages(token) {
  console.log(`\n⭐ Testing Get Starred Messages...`);
  const result = await apiCall('get', '/api/messages/starred', null, token);
  if (result.success) {
    console.log(`✅ Got ${result.data.length} starred messages`);
    return result.data;
  } else {
    console.log(`❌ Get starred messages failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function testUpdateWallpaper(token, wallpaper) {
  console.log(`\n🖼️ Testing Update Wallpaper...`);
  const result = await apiCall('post', '/api/update-wallpaper', { wallpaper }, token);
  if (result.success) {
    console.log(`✅ Wallpaper updated to: ${wallpaper}`);
    return true;
  } else {
    console.log(`❌ Update wallpaper failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testBlockContact(token, username) {
  console.log(`\n🚫 Testing Block Contact ${username}...`);
  const result = await apiCall('post', '/api/block-contact', { username }, token);
  if (result.success) {
    console.log(`✅ Contact blocked: ${username}`);
    return true;
  } else {
    console.log(`❌ Block contact failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testGetBlockedContacts(token) {
  console.log(`\n🚫 Testing Get Blocked Contacts...`);
  const result = await apiCall('get', '/api/blocked-contacts', null, token);
  if (result.success) {
    console.log(`✅ Got ${result.data.length} blocked contacts`);
    return result.data;
  } else {
    console.log(`❌ Get blocked contacts failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function testUnblockContact(token, username) {
  console.log(`\n✅ Testing Unblock Contact ${username}...`);
  const result = await apiCall('post', '/api/unblock-contact', { username }, token);
  if (result.success) {
    console.log(`✅ Contact unblocked: ${username}`);
    return true;
  } else {
    console.log(`❌ Unblock contact failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testAddGroupMember(token, groupId, username) {
  console.log(`\n➕ Testing Add Group Member ${username}...`);
  const result = await apiCall('post', `/api/groups/${groupId}/add-member`, { username }, token);
  if (result.success) {
    console.log(`✅ Member added: ${username}`);
    return true;
  } else {
    console.log(`❌ Add member failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testRemoveGroupMember(token, groupId, username) {
  console.log(`\n➖ Testing Remove Group Member ${username}...`);
  const result = await apiCall('post', `/api/groups/${groupId}/remove-member`, { username }, token);
  if (result.success) {
    console.log(`✅ Member removed: ${username}`);
    return true;
  } else {
    console.log(`❌ Remove member failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testUpdateGroupSettings(token, groupId) {
  console.log(`\n⚙️ Testing Update Group Settings...`);
  const result = await apiCall('put', `/api/groups/${groupId}/settings`, {
    name: 'Updated Test Group',
    description: 'Updated description'
  }, token);
  if (result.success) {
    console.log(`✅ Group settings updated`);
    return true;
  } else {
    console.log(`❌ Update group settings failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testDeleteGroup(token, groupId) {
  console.log(`\n🗑️ Testing Delete Group...`);
  const result = await apiCall('delete', `/api/groups/${groupId}`, null, token);
  if (result.success) {
    console.log(`✅ Group deleted`);
    return true;
  } else {
    console.log(`❌ Delete group failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testGetUserPublicProfile(token, username) {
  console.log(`\n👤 Testing Get User Public Profile for ${username}...`);
  const result = await apiCall('get', `/api/user-public-profile/${username}`, null, token);
  if (result.success) {
    console.log(`✅ Got user profile:`);
    console.log(`   - Username: ${result.data.username}`);
    console.log(`   - Display Name: ${result.data.displayName}`);
    console.log(`   - About: ${result.data.about}`);
    console.log(`   - Online: ${result.data.isOnline}`);
    return result.data;
  } else {
    console.log(`❌ Get user public profile failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testDeleteAccount(token, username) {
  console.log(`\n🗑️ Testing Delete Account for ${username}...`);
  const result = await apiCall('delete', '/api/delete-account', null, token);
  if (result.success) {
    console.log(`✅ Account deleted: ${username}`);
    return true;
  } else {
    console.log(`❌ Delete account failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting WhatsApp Lite API Tests...\n');
  console.log('=' .repeat(60));

  // 1. Test Registration/Login
  console.log('\n📌 PHASE 1: Authentication Tests');
  console.log('=' .repeat(60));
  for (const user of testUsers) {
    await testRegister(user);
  }

  // Check if we have tokens
  if (Object.keys(tokens).length === 0) {
    console.log('\n❌ No tokens available. Cannot continue tests.');
    return;
  }

  // 2. Test User Operations
  console.log('\n📌 PHASE 2: User Operations Tests');
  console.log('=' .repeat(60));
  const firstUser = Object.keys(tokens)[0];
  const usernames = Object.keys(tokens);
  await testGetUsers(tokens[firstUser], firstUser);
  await testGetUserSettings(tokens[firstUser], firstUser);
  await testUpdateProfile(tokens[firstUser], firstUser);
  
  // Test user public profile
  if (usernames.length >= 2) {
    await testGetUserPublicProfile(tokens[firstUser], usernames[1]);
  }

  // 3. Test Recent Chats
  console.log('\n📌 PHASE 3: Recent Chats Tests');
  console.log('=' .repeat(60));
  await testGetRecentChats(tokens[firstUser], firstUser);

  // 4. Test Messaging
  console.log('\n📌 PHASE 4: Messaging Tests');
  console.log('=' .repeat(60));
  if (usernames.length >= 2) {
    await testSendMessage(tokens[usernames[0]], usernames[0], usernames[1]);
    await testGetMessages(tokens[usernames[1]], usernames[1], usernames[0]);
    
    if (testMessageId) {
      await testStarMessage(tokens[usernames[0]], testMessageId);
      await testGetStarredMessages(tokens[usernames[0]]);
    }
  }

  // 5. Test Group Operations
  console.log('\n📌 PHASE 5: Group Operations Tests');
  console.log('=' .repeat(60));
  await testCreateGroup(tokens[firstUser], firstUser);
  await testGetGroups(tokens[firstUser], firstUser);
  
  if (testGroupId) {
    if (usernames.length >= 3) {
      await testAddGroupMember(tokens[firstUser], testGroupId, usernames[2]);
      await testRemoveGroupMember(tokens[firstUser], testGroupId, usernames[2]);
    }
    await testUpdateGroupSettings(tokens[firstUser], testGroupId);
  }

  // 6. Test Privacy Settings
  console.log('\n📌 PHASE 6: Privacy Settings Tests');
  console.log('=' .repeat(60));
  if (usernames.length >= 2) {
    await testBlockContact(tokens[usernames[0]], usernames[1]);
    await testGetBlockedContacts(tokens[usernames[0]]);
    await testUnblockContact(tokens[usernames[0]], usernames[1]);
  }

  // 7. Test Wallpaper
  console.log('\n📌 PHASE 7: Wallpaper Tests');
  console.log('=' .repeat(60));
  await testUpdateWallpaper(tokens[firstUser], 'dark');
  await testGetUserSettings(tokens[firstUser], firstUser);

  // 8. Test Group Deletion
  console.log('\n📌 PHASE 8: Group Deletion Tests');
  console.log('=' .repeat(60));
  if (testGroupId) {
    await testDeleteGroup(tokens[firstUser], testGroupId);
    await testGetGroups(tokens[firstUser], firstUser);
  }

  // 9. Test Account Deletion (optional - uncomment to test)
  // console.log('\n📌 PHASE 9: Account Deletion Tests');
  // console.log('=' .repeat(60));
  // for (const username of Object.keys(tokens)) {
  //   await testDeleteAccount(tokens[username], username);
  // }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Tests Completed!');
  console.log('=' .repeat(60));
}

// Run tests
runTests().catch(console.error);
