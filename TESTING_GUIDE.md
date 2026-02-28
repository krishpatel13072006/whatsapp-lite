# WhatsApp Lite - Complete Testing Guide

## ✅ MongoDB Setup Complete

Your MongoDB Atlas is now configured:
- **IP Whitelist**: `0.0.0.0/0` (Access from anywhere)
- **Database**: `whatsapp_lite`
- **Connection String**: Configured in `.env`

---

## 🚀 Starting the Application

### **Step 1: Start Backend Server**

Open **Terminal 1** and run:
```bash
cd c:\Users\HP\whatsapp-lite\backend
node server.js
```

**Expected Output:**
```
✅ Server is running on port 5000
✅ MongoDB connected successfully!
📱 Ready for testing!
```

**If you see MongoDB error:**
- The app will automatically use in-memory storage
- All features will still work for testing

---

### **Step 2: Start Frontend**

Open **Terminal 2** and run:
```bash
cd c:\Users\HP\whatsapp-lite\frontend
npm start
```

**Expected Output:**
- Browser opens at `http://localhost:3000`
- You see WhatsApp Lite login screen

---

## 📱 Testing the Application

### **Test 1: User Registration & Login**

**Browser 1:**
1. Go to `http://localhost:3000`
2. Click **"Sign Up"**
3. Enter:
   - Username: `user1`
   - Password: `password123`
4. Click **"Sign Up"**
5. See: ✅ "Account created successfully!"
6. Click **"Sign In"**
7. Enter same credentials
8. Click **"Sign In"**

**Expected Result:** ✅ Login successful, see chat interface

---

### **Test 2: Second User**

**Browser 2** (New window or Incognito):
1. Go to `http://localhost:3000`
2. Click **"Sign Up"**
3. Enter:
   - Username: `user2`
   - Password: `password123`
4. Click **"Sign Up"** → See success
5. Click **"Sign In"** with same credentials

**Expected Result:** ✅ Both users logged in

---

### **Test 3: Real-Time Messaging**

**Browser 1 (user1):**
1. In search box, type: `user2`
2. Click **"Start Chat"**
3. Type message: `Hello from user1!`
4. Press **Enter** or click **Send**

**Browser 2 (user2):**
1. You should see message appear instantly
2. Type reply: `Hello from user1! This is user2`
3. Send message

**Expected Result:** ✅ Messages appear in real-time

---

### **Test 4: Typing Indicator**

**Browser 1:**
1. Start typing in message box
2. Watch Browser 2

**Browser 2:**
1. You should see: `typing...` under user1's name
2. When user1 stops typing, it disappears

**Expected Result:** ✅ Typing indicator works

---

### **Test 5: Online Status**

**Browser 1:**
1. Look at chat header - should show: `Online` (green)

**Browser 2:**
1. Look at chat header - should show: `Online` (green)

**Expected Result:** ✅ Online status shows correctly

---

### **Test 6: Voice Call**

**Browser 1:**
1. Click **phone icon** (voice call)
2. Allow microphone access when prompted

**Browser 2:**
1. You should see: **"Incoming Voice Call from user1"**
2. Click **green phone button** to accept

**Expected Result:** ✅ Call interface appears, audio works

---

### **Test 7: Video Call**

**Browser 1:**
1. Click **video icon** (video call)
2. Allow camera & microphone access

**Browser 2:**
1. You should see: **"Incoming Video Call from user1"**
2. Click **green phone button** to accept

**Expected Result:** ✅ Video appears, both users can see each other

---

### **Test 8: File Sharing**

**Browser 1:**
1. Click **paperclip icon** (attach file)
2. Select an image or file
3. Click **"Send File"**

**Browser 2:**
1. You should see the file/image in chat
2. Click to download or view

**Expected Result:** ✅ File appears in chat

---

### **Test 9: Settings & Profile**

**Browser 1:**
1. Click **settings icon** (gear icon)
2. Update:
   - Display Name: `User One`
   - About: `Testing WhatsApp Lite`
   - Email: `user1@test.com`
3. Click **"Save Profile"**

**Expected Result:** ✅ Profile updated

---

### **Test 10: Block Contact**

**Browser 1:**
1. Click **X icon** (block button) in chat header
2. Click **"Block"** in confirmation

**Browser 2:**
1. Try to send message
2. You should see: ❌ "Cannot send message to this user"

**Expected Result:** ✅ Blocking works

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Try again
node server.js
```

### Frontend won't start
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install
npm start
```

### MongoDB connection fails
- Check IP whitelist in MongoDB Atlas
- Verify credentials in `.env`
- App will use in-memory storage as fallback

### Messages not appearing
- Refresh page
- Check backend console for errors
- Verify both users are logged in

### Calls not working
- Allow camera/microphone permissions
- Check browser console (F12)
- Verify both users are online

---

## 📊 Database Status

**Check if MongoDB is connected:**
```bash
cd c:\Users\HP\whatsapp-lite\backend
node test-db.js
```

**If connected:** ✅ All data persists in MongoDB
**If not connected:** ⚠️ Data stored in memory (lost on restart)

---

## 🎉 Success Indicators

✅ Backend shows: `✅ MongoDB connected successfully!`
✅ Frontend loads at `http://localhost:3000`
✅ Can register and login
✅ Can send/receive messages in real-time
✅ Can make voice and video calls
✅ Can share files
✅ Can update profile and settings

---

## 📝 Quick Commands

**Start Backend:**
```bash
cd c:\Users\HP\whatsapp-lite\backend && node server.js
```

**Start Frontend:**
```bash
cd c:\Users\HP\whatsapp-lite\frontend && npm start
```

**Test MongoDB:**
```bash
cd c:\Users\HP\whatsapp-lite\backend && node test-db.js
```

**View Logs:**
- Backend: Check Terminal 1
- Frontend: Check Terminal 2
- Browser: Press F12 → Console tab

---

## 🚀 You're All Set!

Your WhatsApp Lite application is ready for testing. Follow the steps above to test all features.

**Happy Testing! 🎉**
