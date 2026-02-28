# WhatsApp Lite - Troubleshooting Guide

## Login Error Solutions

### Error: "Cannot connect to server. Make sure backend is running on port 5000."

**This means the backend server is NOT running.**

**Solution:**
```bash
cd c:\Users\HP\whatsapp-lite\backend
npm install
node server.js
```

**Expected output:**
```
✅ Server is running on port 5000
✅ MongoDB connected
```

**If you see "MongoDB connection error":**
- Your MongoDB Atlas connection might be failing
- Check your internet connection
- Verify MONGO_URI in `.env` file is correct
- The server will still run, but persistence won't work

---

### Error: "Invalid username or password."

**This means:**
- Username doesn't exist in database, OR
- Password is incorrect

**Solution:**
1. Make sure you registered the account first
2. Use exact same username and password
3. Check for typos (case-sensitive)
4. Try registering a new account with a different username

**Registration Steps:**
1. Click "Sign Up" button
2. Enter username: `testuser123`
3. Enter password: `password123`
4. Click "Sign Up"
5. You should see: "✅ Account created successfully!"
6. Then click "Sign In" and use same credentials

---

### Error: "Server error: ..."

**This means there's an issue on the backend.**

**Solution:**
1. Check backend terminal for error messages
2. Look for MongoDB connection errors
3. Restart the backend server:
   ```bash
   cd c:\Users\HP\whatsapp-lite\backend
   node server.js
   ```

---

## Complete Setup from Scratch

### Step 1: Install Dependencies

**Backend:**
```bash
cd c:\Users\HP\whatsapp-lite\backend
npm install
```

**Frontend:**
```bash
cd c:\Users\HP\whatsapp-lite\frontend
npm install
```

### Step 2: Verify Environment Variables

Check `c:\Users\HP\whatsapp-lite\backend\.env`:
```
MONGO_URI=mongodb+srv://krish:krishpatel123123@devcluster.rkrdcgt.mongodb.net/whatsapp_lite
JWT_SECRET=your_super_secret_jwt_key_123
```

If these are missing, add them.

### Step 3: Start Backend

**Terminal 1:**
```bash
cd c:\Users\HP\whatsapp-lite\backend
node server.js
```

**Wait for:**
```
✅ Server is running on port 5000
```

### Step 4: Start Frontend

**Terminal 2:**
```bash
cd c:\Users\HP\whatsapp-lite\frontend
npm start
```

**Wait for:**
- Browser opens at `http://localhost:3000`
- You see the WhatsApp Lite login screen

### Step 5: Test Registration

1. Click "Sign Up"
2. Username: `user1`
3. Password: `password123`
4. Click "Sign Up"
5. See success message
6. Click "Sign In"
7. Enter same credentials
8. Click "Sign In"

**If login fails, check:**
- Backend terminal for errors
- Browser console (F12 → Console tab)
- Network tab (F12 → Network tab) to see API response

---

## Debugging Tips

### Check Backend Logs

Look at the backend terminal for messages like:
```
✅ Server is running on port 5000
✅ MongoDB connected
User user1 connected with socket abc123
Message received: { ... }
```

### Check Browser Console

Press `F12` in browser and go to "Console" tab. Look for:
- Red errors (❌ problems)
- Blue info messages (ℹ️ helpful info)
- Network errors

### Check Network Requests

Press `F12` → "Network" tab:
1. Try to login
2. Look for `login` request
3. Click on it
4. Check "Response" tab for error details

### MongoDB Connection Test

If MongoDB is failing, test the connection:
```bash
cd c:\Users\HP\whatsapp-lite\backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://krish:krishpatel123123@devcluster.rkrdcgt.mongodb.net/whatsapp_lite')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err.message));
"
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot connect to server" | Backend not running | Run `node server.js` in backend folder |
| "Invalid username or password" | Wrong credentials or user doesn't exist | Register first, then login with same credentials |
| "Server error" | MongoDB connection failed | Check MONGO_URI in .env file |
| Messages not appearing | Socket not connected | Refresh page, check backend logs |
| Calls not working | WebRTC issue | Allow camera/microphone permissions |
| Port 5000 already in use | Another app using port 5000 | Kill process: `netstat -ano \| findstr :5000` |

---

## Quick Commands

**Kill process on port 5000 (Windows):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Kill process on port 3000 (Windows):**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Clear npm cache:**
```bash
npm cache clean --force
```

**Reinstall dependencies:**
```bash
rm -r node_modules package-lock.json
npm install
```

---

## Still Having Issues?

1. **Check backend terminal** - Look for error messages
2. **Check browser console** - Press F12 → Console
3. **Check network tab** - Press F12 → Network → Try login → Look for failed requests
4. **Restart everything** - Kill both servers and start fresh
5. **Clear browser cache** - Ctrl+Shift+Delete
6. **Check MongoDB** - Verify connection string in .env

---

## Success Indicators

✅ **Backend running:**
```
✅ Server is running on port 5000
✅ MongoDB connected
```

✅ **Frontend running:**
- Browser opens at http://localhost:3000
- You see WhatsApp Lite login screen

✅ **Registration successful:**
- "✅ Account created successfully!" message appears

✅ **Login successful:**
- You see the chat interface
- Your username appears in top-left
- You can see "Your ID: username" in welcome screen

✅ **Socket connected:**
- Backend shows: "User username connected with socket abc123"
- Frontend shows no connection errors in console

---

## Next Steps After Login

1. **Register two users** (user1 and user2)
2. **Login with user1** in Browser 1
3. **Login with user2** in Browser 2
4. **Send message** from user1 to user2
5. **Verify message appears** in user2's chat
6. **Test voice/video call** between users

If all these work, your application is fully functional! 🎉
