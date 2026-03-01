require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Import configuration
const { connectDB } = require('./config/database');

// Import routes
const { authRoutes, userRoutes } = require('./routes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://whatsapp-lite-12311.netlify.app", "https://wahtsapplite-12311.netlify.app"],
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/stickers', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://whatsapp-lite-12311.netlify.app", "https://wahtsapplite-12311.netlify.app"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Handle user coming online
  socket.on('user-online', async (username) => {
    try {
      const { User } = require('./models');
      await User.findOneAndUpdate(
        { username },
        { isOnline: true, socketId: socket.id, lastSeen: new Date() }
      );
      socket.username = username;
      console.log(`✅ User online: ${username} (${socket.id})`);

      // Broadcast to all clients that this user is online
      io.emit('user-status', { username, isOnline: true });
    } catch (error) {
      console.error('Error setting user online:', error.message);
    }
  });

  // Handle user going offline
  socket.on('disconnect', async () => {
    try {
      if (socket.username) {
        const { User } = require('./models');
        await User.findOneAndUpdate(
          { username: socket.username },
          { isOnline: false, lastSeen: new Date(), socketId: null }
        );
        console.log(`👋 User offline: ${socket.username}`);

        // Broadcast to all clients that this user is offline
        io.emit('user-status', { username: socket.username, isOnline: false });
      }
    } catch (error) {
      console.error('Error setting user offline:', error.message);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Export for testing
module.exports = { app, server, io };