# WhatsApp Lite - Setup Instructions

## Prerequisites
- Node.js installed
- MongoDB Atlas account (or local MongoDB)
- Two browser windows/tabs

## Step 1: Start the Backend Server

```bash
cd c:\Users\HP\whatsapp-lite\backend
npm install
node server.js
```

**Expected Output:**
```
✅ Server is running on port 5000
✅ MongoDB connected
```

**If you see MongoDB connection error:**
- Check your `.env` file has correct `MONGO_URI`
- Verify MongoDB Atlas credentials
- Check internet connection

## Step 2: Start the Frontend

Open a NEW terminal and run:

```bash
cd c:\Users\HP\whatsapp-lite\frontend
npm install
npm start
```

**Expected Output:**
- Browser opens at `http://localhost:3000`
- You see the WhatsApp Lite login screen

## Step 3: Test with Two Users

### Browser 1 (User 1):
1. Go to `http://localhost:3000`
2. Click "Sign Up"
3. Enter:
   - Username: `user1`
   - Password: `password123`
4. Click "Sign Up"
5. You should see: "✅ Account created successfully!"
6. Click "Sign In"
7. Enter same credentials and click "Sign In"

### Browser 2 (User 2):
1. Open a NEW browser window or Incognito tab
2. Go to `http://localhost:3000`
3. Click "Sign Up"
4. Enter:
   - Username: `user2`
   - Password: `password123`
5. Click "Sign Up"
6. Click "Sign In"
7. Enter same credentials and click "Sign In"

## Step 4: Test Messaging

### In Browser 1 (User 1):
1. In the search box, type: `user2`
2. Click "Start Chat"
3. Type a message: "Hello from user1"
4. Press Enter or click Send button

### In Browser 2 (User 2):
1. You should see the message appear in real-time
2. Type a reply: "Hello from user2"
3. Send it

## Step 5: Test Calls

### In Browser 1 (User 1):
1. Click the phone icon (voice call) or video icon (video call)
2. Browser 2 should show an incoming call notification

### In Browser 2 (User 2):
1. Click the green phone button to accept the call
2. You should see the call interface

## Troubleshooting

### Login Error: "Login failed. Check your username and password."
- **Solution 1:** Make sure backend server is running (`node server.js`)
- **Solution 2:** Check MongoDB connection in backend terminal
- **Solution 3:** Clear browser cache (Ctrl+Shift+Delete) and try again
- **Solution 4:** Check browser console (F12 → Console tab) for detailed error

### Messages not appearing:
- Both users must be logged in
- Check backend terminal for "Message received" logs
- Verify both browsers show "Online" status

### Calls not working:
- Allow camera/microphone permissions when prompted
- Check browser console for WebRTC errors
- Both users must be logged in and online

### MongoDB Connection Error:
- Verify MONGO_URI in `.env` file
- Check MongoDB Atlas IP whitelist includes your IP
- Test connection: `mongo "mongodb+srv://krish:krishpatel123123@devcluster.rkrdcgt.mongodb.net/whatsapp_lite"`

## Quick Start (Copy & Paste)

**Terminal 1 - Backend:**
```bash
cd c:\Users\HP\whatsapp-lite\backend && node server.js
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\HP\whatsapp-lite\frontend && npm start
```

Then follow Step 3 above.
