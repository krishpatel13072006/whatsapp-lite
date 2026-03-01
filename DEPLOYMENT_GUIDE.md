# WhatsApp Lite Deployment Guide

## Deploy Backend First (Then Frontend)

---

## Step 1: Deploy Backend on Render (Free)

### Option A: From GitHub

1. **Push backend to GitHub:**
   ```bash
   # Create GitHub repo first, then:
   cd backend
   git init
   git add .
   git commit -m "Backend ready"
   git remote add origin https://github.com/YOUR_USERNAME/whatsapp-lite.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) → Sign up with GitHub
   - Click "New" → "Web Service"
   - Select your GitHub repository
   - **IMPORTANT - Set Root Directory:**
     - Look for "Root Directory" field
     - Set it to: `backend`
     - (This tells Render to look in the backend folder)
   - Configure:
     - Name: `whatsapp-lite-backend`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
   - Click "Create Web Service"

3. **Add Environment Variables:**
   - Go to "Environment" tab in Render dashboard
   - Add these variables:
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Any random string (e.g., `mysecret123`)
     - `PORT`: 3001
   - Click "Save Changes"

4. **Your backend URL:** `https://whatsapp-lite-backend.onrender.com`

---

### Option B: From CLI (Render)

1. **Install Render CLI:**
   ```bash
   npm install -g @render/cli
   render login
   ```

2. **Deploy:**
   ```bash
   cd backend
   render create service
   # Follow prompts:
   # - Select repository
   # - Name: whatsapp-lite-backend
   # - Start command: node server.js
   # - Environment: Node
   ```

---

## Step 2: Deploy Frontend

### Update Backend URL in Frontend First!

1. **Edit:** `frontend/src/App.js`

2. **Find** the API URL (search for `axios` or `API_URL` or `baseURL`)

3. **Change** it to your Render backend URL:
   ```javascript
   // Example:
   const API_URL = 'https://whatsapp-lite-backend.onrender.com';
   ```

4. **Save the file**

---

### Deploy Frontend on Vercel (Free)

```bash
cd frontend
npm run build
npm i -g vercel
vercel --prod
```

### OR Deploy on Netlify

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `frontend/build` folder
3. Done!

---

## Quick Summary

| Step | Action |
|------|--------|
| 1 | Push `backend/` to GitHub |
| 2 | Deploy backend on Render |
| 3 | Add `MONGO_URI`, `JWT_SECRET` in Render |
| 4 | Update backend URL in `frontend/src/App.js` |
| 5 | Build: `cd frontend && npm run build` |
| 6 | Deploy frontend on Vercel/Netlify |
| 7 | Test your app! |

---

## Get Free MongoDB (If Needed)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account → Create Free Cluster
3. Create database user (username/password)
4. Network Access → Add IP: `0.0.0.0/0`
5. Connect → "Connect your application" → Copy URI
6. Replace `<password>` with your DB password
