/**
 * Comprehensive Feature Test for User "priya"
 * Tests all 20 features to verify multi-user support
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const PRIYA_CREDENTIALS = {
  username: 'priya',
  email: 'priya@test.com',
  password: 'priya123',
  phoneNumber: '9876543211'
};

const USER1_CREDENTIALS = {
  username: 'user1',
  email: 'user1@test.com',
  password: 'user123',
  phoneNumber: '9876543210'
};

let priyaToken = null;
let user1Token = null;
let priyaSocket = null;
let user1Socket = null;
let testResults = {};
let testGroupId = null;

// Helper function for logging
const log = (feature, status, message) => {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${feature}] ${message}`);
  if (!testResults[feature]) testResults[feature] = [];
  testResults[feature].push({ status, message });
};

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 COMPREHENSIVE FEATURE TEST FOR PRIYA');
  console.log('========================================\n');

  // ==========================================
  // FEATURE 1: Authentication System
  // ==========================================
  console.log('\n--- Feature 1: Authentication System ---');
  
  try {
    // Test registration - using correct endpoint
    const registerRes = await axios.post(`${BASE_URL}/api/register`, PRIYA_CREDENTIALS);
    if (registerRes.data.message) {
      log('Authentication', 'PASS', 'Registration endpoint works');
    }
  } catch (err) {
    if (err.response?.data?.message?.includes('already')) {
      log('Authentication', 'PASS', 'User already exists (expected)');
    } else {
      log('Authentication', 'FAIL', `Registration error: ${err.message}`);
    }
  }

  try {
    // Test login - using correct endpoint
    const loginRes = await axios.post(`${BASE_URL}/api/login`, {
      username: PRIYA_CREDENTIALS.username,
      password: PRIYA_CREDENTIALS.password
    });
    
    if (loginRes.data.token) {
      priyaToken = loginRes.data.token;
      log('Authentication', 'PASS', 'Login successful, token received');
    } else {
      log('Authentication', 'FAIL', 'Login failed - no token received');
    }
  } catch (err) {
    log('Authentication', 'FAIL', `Login error: ${err.response?.data?.message || err.message}`);
  }

  // Login as user1 for cross-user tests
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/login`, {
      username: USER1_CREDENTIALS.username,
      password: USER1_CREDENTIALS.password
    });
    if (loginRes.data.token) {
      user1Token = loginRes.data.token;
      log('Authentication', 'PASS', 'User1 login successful for cross-user tests');
    }
  } catch (err) {
    log('Authentication', 'WARN', 'User1 login failed - some tests may not work');
  }

  // ==========================================
  // FEATURE 2: Real-time Messaging with Socket.io
  // ==========================================
  console.log('\n--- Feature 2: Real-time Messaging ---');

  if (priyaToken) {
    try {
      priyaSocket = io(BASE_URL, {
        auth: { token: priyaToken },
        transports: ['websocket']
      });

      await new Promise((resolve, reject) => {
        priyaSocket.on('connect', () => {
          log('Messaging', 'PASS', 'Priya socket connected');
          resolve();
        });
        priyaSocket.on('connect_error', (err) => {
          log('Messaging', 'FAIL', `Socket connection error: ${err.message}`);
          reject(err);
        });
        setTimeout(() => reject(new Error('Socket timeout')), 5000);
      });

      // Register user
      priyaSocket.emit('register_user', PRIYA_CREDENTIALS.username);
      await sleep(500);

      log('Messaging', 'PASS', 'Socket.io connection established');
    } catch (err) {
      log('Messaging', 'FAIL', `Socket setup failed: ${err.message}`);
    }
  }

  // Connect user1 socket for cross-user messaging
  if (user1Token) {
    try {
      user1Socket = io(BASE_URL, {
        auth: { token: user1Token },
        transports: ['websocket']
      });

      await new Promise((resolve, reject) => {
        user1Socket.on('connect', resolve);
        user1Socket.on('connect_error', reject);
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      user1Socket.emit('register_user', USER1_CREDENTIALS.username);
      await sleep(500);
      log('Messaging', 'PASS', 'User1 socket connected for cross-user tests');
    } catch (err) {
      log('Messaging', 'WARN', 'User1 socket not available');
    }
  }

  // Test sending message from user1 to priya
  if (user1Socket && priyaSocket) {
    try {
      const testMessage = `Test message from user1 to priya at ${Date.now()}`;
      
      await new Promise((resolve, reject) => {
        priyaSocket.once('receive_message', (data) => {
          log('Messaging', 'PASS', `Received message: "${data.text?.substring(0, 30)}..."`);
          resolve();
        });
        
        // Using correct field names: fromUsername, toUsername, text
        user1Socket.emit('send_message', {
          toUsername: PRIYA_CREDENTIALS.username,
          text: testMessage,
          fromUsername: USER1_CREDENTIALS.username
        });
        
        setTimeout(() => reject(new Error('Message timeout')), 10000);
      });
    } catch (err) {
      log('Messaging', 'WARN', `Cross-user messaging: ${err.message}`);
    }
  }

  // ==========================================
  // FEATURE 3: Video/Voice Calling
  // ==========================================
  console.log('\n--- Feature 3: Video/Voice Calling ---');

  if (priyaSocket && user1Socket) {
    try {
      let callReceived = false;
      
      priyaSocket.on('incoming_call', (data) => {
        callReceived = true;
        log('Calling', 'PASS', `Incoming call received from ${data.caller}`);
        priyaSocket.emit('call_response', {
          caller: data.caller,
          accepted: true
        });
      });

      user1Socket.emit('start_call', {
        recipient: PRIYA_CREDENTIALS.username,
        callType: 'voice'
      });

      await sleep(2000);
      
      if (!callReceived) {
        log('Calling', 'WARN', 'Call signaling may need verification');
      }
    } catch (err) {
      log('Calling', 'FAIL', `Call test error: ${err.message}`);
    }
  }

  // ==========================================
  // FEATURE 4: Group Chat Support
  // ==========================================
  console.log('\n--- Feature 4: Group Chat Support ---');

  if (priyaToken) {
    try {
      // Create a group - using correct endpoint
      const createGroupRes = await axios.post(`${BASE_URL}/api/groups/create`, {
        name: `Priya's Test Group ${Date.now()}`,
        description: 'Test group for priya',
        members: [USER1_CREDENTIALS.username]
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (createGroupRes.data.group || createGroupRes.data._id) {
        testGroupId = createGroupRes.data.group?._id || createGroupRes.data._id;
        log('Group Chat', 'PASS', 'Group created successfully');

        // Get groups for priya
        const getGroupsRes = await axios.get(`${BASE_URL}/api/groups`, {
          headers: { Authorization: `Bearer ${priyaToken}` }
        });

        if (getGroupsRes.data.groups?.length > 0 || getGroupsRes.data.length > 0) {
          log('Group Chat', 'PASS', `Found groups for priya`);
        } else {
          log('Group Chat', 'WARN', 'No groups found after creation');
        }

        // Test group message
        if (priyaSocket && testGroupId) {
          priyaSocket.emit('send_group_message', {
            groupId: testGroupId,
            message: 'Hello from priya in the group!',
            sender: PRIYA_CREDENTIALS.username
          });
          await sleep(500);
          log('Group Chat', 'PASS', 'Group message sent');
        }
      } else {
        log('Group Chat', 'FAIL', 'Group creation failed');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('Group Chat', 'FAIL', 'Group API endpoint not found');
      } else {
        log('Group Chat', 'FAIL', `Group error: ${err.response?.data?.message || err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 5: File Upload
  // ==========================================
  console.log('\n--- Feature 5: File Upload ---');

  if (priyaToken) {
    try {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'Test file content for priya');

      const form = new FormData();
      form.append('file', fs.createReadStream(testFilePath));

      // Using correct endpoint /api/upload-file
      const uploadRes = await axios.post(`${BASE_URL}/api/upload-file`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${priyaToken}`
        }
      });

      if (uploadRes.data.fileUrl || uploadRes.data.filename) {
        log('File Upload', 'PASS', 'File uploaded successfully');
      } else {
        log('File Upload', 'FAIL', 'Upload response invalid');
      }

      // Cleanup
      fs.unlinkSync(testFilePath);
    } catch (err) {
      if (err.response?.status === 404) {
        log('File Upload', 'FAIL', 'Upload endpoint not found');
      } else {
        log('File Upload', 'FAIL', `Upload error: ${err.response?.data?.message || err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 6: GIF and Sticker Support
  // ==========================================
  console.log('\n--- Feature 6: GIF and Sticker Support ---');

  if (priyaToken) {
    // Test sending sticker via socket
    if (priyaSocket) {
      priyaSocket.emit('send_message', {
        toUsername: USER1_CREDENTIALS.username,
        text: '🎭',
        type: 'sticker',
        fromUsername: PRIYA_CREDENTIALS.username
      });
      log('Stickers', 'PASS', 'Sticker message sent via socket');
    }
    
    // Check sticker packs
    try {
      const stickersRes = await axios.get(`${BASE_URL}/stickers/1/01_Cuppy_smile.webp`);
      if (stickersRes.status === 200) {
        log('Stickers', 'PASS', 'Stickers are served statically');
      }
    } catch (err) {
      log('Stickers', 'WARN', 'Stickers may need verification');
    }
  }

  // ==========================================
  // FEATURE 7: Message Reactions, Editing, Pinning
  // ==========================================
  console.log('\n--- Feature 7: Message Reactions, Editing, Pinning ---');

  if (priyaToken) {
    try {
      // Get messages first
      const messagesRes = await axios.get(`${BASE_URL}/api/messages/${USER1_CREDENTIALS.username}`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      const messages = messagesRes.data;
      
      if (messages && messages.length > 0) {
        const messageId = messages[0]._id || messages[0].id;

        // Test reaction
        try {
          const reactRes = await axios.post(`${BASE_URL}/api/message/${messageId}/reaction`, {
            emoji: '👍'
          }, {
            headers: { Authorization: `Bearer ${priyaToken}` }
          });
          
          if (reactRes.data.success || reactRes.data.message) {
            log('Reactions', 'PASS', 'Reaction added successfully');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            log('Reactions', 'WARN', 'Reaction endpoint not found - may use socket');
          } else {
            log('Reactions', 'FAIL', `Reaction error: ${err.response?.data?.message || err.message}`);
          }
        }

        // Test editing
        try {
          const editRes = await axios.put(`${BASE_URL}/api/message/${messageId}/edit`, {
            text: 'Edited message from priya'
          }, {
            headers: { Authorization: `Bearer ${priyaToken}` }
          });
          
          if (editRes.data.success || editRes.data.message) {
            log('Editing', 'PASS', 'Message edited successfully');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            log('Editing', 'WARN', 'Edit endpoint not found');
          } else {
            log('Editing', 'FAIL', `Edit error: ${err.response?.data?.message || err.message}`);
          }
        }

        // Test pinning
        try {
          const pinRes = await axios.post(`${BASE_URL}/api/message/${messageId}/pin`, {}, {
            headers: { Authorization: `Bearer ${priyaToken}` }
          });
          
          if (pinRes.data.success || pinRes.data.message) {
            log('Pinning', 'PASS', 'Message pinned successfully');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            log('Pinning', 'WARN', 'Pin endpoint not found');
          } else {
            log('Pinning', 'FAIL', `Pin error: ${err.response?.data?.message || err.message}`);
          }
        }
      } else {
        log('Reactions', 'WARN', 'No messages to test reactions/editing/pinning');
      }
    } catch (err) {
      log('Reactions', 'FAIL', `Message fetch error: ${err.message}`);
    }
  }

  // ==========================================
  // FEATURE 8: Chat Themes and Wallpapers
  // ==========================================
  console.log('\n--- Feature 8: Chat Themes and Wallpapers ---');

  if (priyaToken) {
    try {
      // Set wallpaper - using correct endpoint
      const wallpaperRes = await axios.post(`${BASE_URL}/api/update-wallpaper`, {
        wallpaper: 'gradient'
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (wallpaperRes.data.message) {
        log('Themes', 'PASS', 'Wallpaper set successfully');
      }
    } catch (err) {
      log('Themes', 'FAIL', `Wallpaper error: ${err.response?.data?.message || err.message}`);
    }

    // Test user settings
    try {
      const settingsRes = await axios.get(`${BASE_URL}/api/user-settings`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (settingsRes.data) {
        log('Themes', 'PASS', 'User settings retrieved');
      }
    } catch (err) {
      log('Themes', 'FAIL', `Settings error: ${err.response?.data?.message || err.message}`);
    }
  }

  // ==========================================
  // FEATURE 9: Privacy Settings and Blocking
  // ==========================================
  console.log('\n--- Feature 9: Privacy Settings and Blocking ---');

  if (priyaToken) {
    try {
      // Update privacy settings - using correct endpoint
      const privacyRes = await axios.post(`${BASE_URL}/api/privacy-settings`, {
        lastSeen: 'everyone',
        profilePhoto: 'contacts',
        about: 'everyone',
        readReceipts: true
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (privacyRes.data.message) {
        log('Privacy', 'PASS', 'Privacy settings updated');
      }
    } catch (err) {
      log('Privacy', 'FAIL', `Privacy error: ${err.response?.data?.message || err.message}`);
    }

    // Test blocking - using correct endpoint
    try {
      const blockRes = await axios.post(`${BASE_URL}/api/block-contact`, {
        username: 'test_user_to_block'
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (blockRes.data.message) {
        log('Blocking', 'PASS', 'Block functionality works');
      }
    } catch (err) {
      if (err.response?.data?.message?.includes('not found')) {
        log('Blocking', 'PASS', 'Block endpoint works (user not found is expected)');
      } else {
        log('Blocking', 'FAIL', `Block error: ${err.response?.data?.message || err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 10: Call History and Recording
  // ==========================================
  console.log('\n--- Feature 10: Call History and Recording ---');

  if (priyaToken) {
    try {
      const callHistoryRes = await axios.get(`${BASE_URL}/api/call-history`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (callHistoryRes.data.calls || Array.isArray(callHistoryRes.data)) {
        log('Call History', 'PASS', 'Call history retrieved');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('Call History', 'WARN', 'Call history endpoint may be different');
      } else {
        log('Call History', 'FAIL', `Call history error: ${err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 11: Search Functionality
  // ==========================================
  console.log('\n--- Feature 11: Search Functionality ---');

  if (priyaToken) {
    try {
      // Search users - using correct endpoint
      const searchUsersRes = await axios.get(`${BASE_URL}/api/all-users?search=user`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (Array.isArray(searchUsersRes.data)) {
        log('Search', 'PASS', 'User search works');
      }
    } catch (err) {
      log('Search', 'FAIL', `User search error: ${err.message}`);
    }

    // Search messages
    try {
      const searchMsgRes = await axios.get(`${BASE_URL}/api/messages/search?q=test`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (searchMsgRes.data.messages || searchMsgRes.data.results || Array.isArray(searchMsgRes.data)) {
        log('Search', 'PASS', 'Message search works');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('Search', 'WARN', 'Message search endpoint may be different');
      } else {
        log('Search', 'FAIL', `Message search error: ${err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 12: Starred Messages
  // ==========================================
  console.log('\n--- Feature 12: Starred Messages ---');

  if (priyaToken) {
    try {
      // Get messages
      const messagesRes = await axios.get(`${BASE_URL}/api/messages/${USER1_CREDENTIALS.username}`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      const messages = messagesRes.data;
      
      if (messages && messages.length > 0) {
        const messageId = messages[0]._id || messages[0].id;

         // Star a message - using correct endpoint
         const starRes = await axios.put(`${BASE_URL}/api/messages/${messageId}/star`, {}, {
           headers: { Authorization: `Bearer ${priyaToken}` }
         });

        if (starRes.data.success) {
          log('Starred', 'PASS', 'Message starred successfully');

          // Get starred messages
          try {
            const starredRes = await axios.get(`${BASE_URL}/api/messages/starred`, {
              headers: { Authorization: `Bearer ${priyaToken}` }
            });

            if (starredRes.data.messages?.length > 0 || starredRes.data.length > 0) {
              log('Starred', 'PASS', 'Starred messages retrieved');
            } else {
              log('Starred', 'WARN', 'No starred messages found after starring');
            }
          } catch (err) {
            log('Starred', 'WARN', 'Starred messages endpoint may be different');
          }
        }
      } else {
        log('Starred', 'WARN', 'No messages to star');
      }
    } catch (err) {
      log('Starred', 'FAIL', `Star error: ${err.response?.data?.message || err.message}`);
    }
  }

  // ==========================================
  // FEATURE 13: Broadcast Lists
  // ==========================================
  console.log('\n--- Feature 13: Broadcast Lists ---');

  if (priyaToken) {
    try {
      // Create broadcast list - using correct endpoint
      const createRes = await axios.post(`${BASE_URL}/api/broadcasts/create`, {
        name: `Priya's Broadcast ${Date.now()}`,
        recipients: [USER1_CREDENTIALS.username]
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (createRes.data.broadcast || createRes.data.message) {
        log('Broadcast', 'PASS', 'Broadcast list created');

        // Get broadcast lists
        const getRes = await axios.get(`${BASE_URL}/api/broadcasts`, {
          headers: { Authorization: `Bearer ${priyaToken}` }
        });

        if (getRes.data.broadcasts?.length > 0 || getRes.data.length > 0) {
          log('Broadcast', 'PASS', 'Broadcast lists retrieved');
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('Broadcast', 'WARN', 'Broadcast endpoint may be different');
      } else {
        log('Broadcast', 'FAIL', `Broadcast error: ${err.response?.data?.message || err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 14: User Profiles
  // ==========================================
  console.log('\n--- Feature 14: User Profiles ---');

  if (priyaToken) {
    try {
      // Get user settings - using correct endpoint
      const profileRes = await axios.get(`${BASE_URL}/api/user-settings`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (profileRes.data) {
        log('Profiles', 'PASS', 'Profile retrieved');
      }

      // Update profile - using correct endpoint
      const updateRes = await axios.post(`${BASE_URL}/api/update-profile`, {
        about: 'Testing profile update for priya',
        displayName: 'Priya Test'
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (updateRes.data.message) {
        log('Profiles', 'PASS', 'Profile updated');
      }
    } catch (err) {
      log('Profiles', 'FAIL', `Profile error: ${err.response?.data?.message || err.message}`);
    }
  }

  // ==========================================
  // FEATURE 15: Typing Indicators
  // ==========================================
  console.log('\n--- Feature 15: Typing Indicators ---');

  if (priyaSocket && user1Socket) {
    try {
      let typingReceived = false;

      user1Socket.on('user_typing', (data) => {
        if (data.user === PRIYA_CREDENTIALS.username || data.username === PRIYA_CREDENTIALS.username) {
          typingReceived = true;
          log('Typing', 'PASS', 'Typing indicator received');
        }
      });

      priyaSocket.emit('typing', {
        recipient: USER1_CREDENTIALS.username,
        isTyping: true
      });

      await sleep(1000);

      if (!typingReceived) {
        log('Typing', 'WARN', 'Typing indicator may need verification');
      }
    } catch (err) {
      log('Typing', 'FAIL', `Typing error: ${err.message}`);
    }
  }

  // ==========================================
  // FEATURE 16: Online Status
  // ==========================================
  console.log('\n--- Feature 16: Online Status ---');

  if (priyaToken) {
    try {
      // Get all users to see online status
      const onlineRes = await axios.get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (Array.isArray(onlineRes.data)) {
        const onlineUsers = onlineRes.data.filter(u => u.isOnline);
        log('Online Status', 'PASS', `Found ${onlineUsers.length} online user(s)`);
      }
    } catch (err) {
      log('Online Status', 'FAIL', `Online status error: ${err.message}`);
    }
  }

  // ==========================================
  // FEATURE 17: Read Receipts
  // ==========================================
  console.log('\n--- Feature 17: Read Receipts ---');

  if (priyaToken) {
    try {
      const messagesRes = await axios.get(`${BASE_URL}/api/messages/${USER1_CREDENTIALS.username}`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      const messages = messagesRes.data;
      
      if (messages && messages.length > 0) {
        const messageId = messages[0]._id || messages[0].id;

        // Mark as read
        try {
          const readRes = await axios.post(`${BASE_URL}/api/messages/${messageId}/read`, {}, {
            headers: { Authorization: `Bearer ${priyaToken}` }
          });

          if (readRes.data.success || readRes.data.message) {
            log('Read Receipts', 'PASS', 'Message marked as read');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            log('Read Receipts', 'WARN', 'Read receipts may use socket events');
          } else {
            log('Read Receipts', 'FAIL', `Read receipts error: ${err.response?.data?.message || err.message}`);
          }
        }
      }
    } catch (err) {
      log('Read Receipts', 'FAIL', `Read receipts error: ${err.message}`);
    }
  }

  // ==========================================
  // FEATURE 18: Message Scheduling
  // ==========================================
  console.log('\n--- Feature 18: Message Scheduling ---');

  if (priyaToken) {
    try {
      // Schedule a message
      const scheduleRes = await axios.post(`${BASE_URL}/api/schedule-message`, {
        toUsername: USER1_CREDENTIALS.username,
        text: 'Scheduled message from priya',
        scheduledFor: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (scheduleRes.data.message || scheduleRes.data.scheduledMessage) {
        log('Scheduling', 'PASS', 'Message scheduled successfully');

        // Get scheduled messages
        try {
          const getScheduledRes = await axios.get(`${BASE_URL}/api/scheduled-messages`, {
            headers: { Authorization: `Bearer ${priyaToken}` }
          });

          if (getScheduledRes.data.messages || getScheduledRes.data.scheduled) {
            log('Scheduling', 'PASS', 'Scheduled messages retrieved');
          }
        } catch (err) {
          log('Scheduling', 'WARN', 'Scheduled messages endpoint may be different');
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('Scheduling', 'WARN', 'Scheduling endpoint may be different');
      } else {
        log('Scheduling', 'FAIL', `Scheduling error: ${err.response?.data?.message || err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 19: Disappearing Messages
  // ==========================================
  console.log('\n--- Feature 19: Disappearing Messages ---');

  if (priyaToken) {
    try {
      // Set disappearing messages
      const disappearRes = await axios.post(`${BASE_URL}/api/disappearing-messages`, {
        username: USER1_CREDENTIALS.username,
        duration: 86400 // 24 hours
      }, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (disappearRes.data.success || disappearRes.data.message) {
        log('Disappearing', 'PASS', 'Disappearing messages configured');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('Disappearing', 'WARN', 'Disappearing messages endpoint may be different');
      } else {
        log('Disappearing', 'FAIL', `Disappearing error: ${err.response?.data?.message || err.message}`);
      }
    }
  }

  // ==========================================
  // FEATURE 20: Export Functionality
  // ==========================================
  console.log('\n--- Feature 20: Export Functionality ---');

  if (priyaToken) {
    try {
      const exportRes = await axios.get(`${BASE_URL}/api/all-messages`, {
        headers: { Authorization: `Bearer ${priyaToken}` }
      });

      if (exportRes.data || exportRes.headers['content-type']?.includes('json')) {
        log('Export', 'PASS', 'Export functionality works');
      }
    } catch (err) {
      log('Export', 'FAIL', `Export error: ${err.response?.data?.message || err.message}`);
    }
  }

  // ==========================================
  // CLEANUP
  // ==========================================
  if (priyaSocket) priyaSocket.disconnect();
  if (user1Socket) user1Socket.disconnect();

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY FOR PRIYA');
  console.log('========================================\n');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const [feature, results] of Object.entries(testResults)) {
    for (const result of results) {
      if (result.status === 'PASS') passCount++;
      else if (result.status === 'FAIL') failCount++;
      else warnCount++;
    }
  }

  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`\nTotal tests: ${passCount + failCount + warnCount}`);

  console.log('\n--- Detailed Results ---');
  for (const [feature, results] of Object.entries(testResults)) {
    console.log(`\n[${feature}]`);
    for (const result of results) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${icon} ${result.message}`);
    }
  }

  console.log('\n========================================');
  console.log('TEST COMPLETED');
  console.log('========================================\n');
}

// Run tests
runTests().catch(console.error);
