const mongoose = require('mongoose');

/**
 * Database configuration and connection
 */
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 URI:', process.env.MONGO_URI.substring(0, 60) + '...');

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2
    });

    console.log('✅ MongoDB connected successfully!');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Please check:');
    console.error('1. IP Whitelist in MongoDB Atlas (should include 0.0.0.0/0)');
    console.error('2. Username and password in .env file');
    console.error('3. Internet connection');
    process.exit(1);
  }
};

/**
 * Get database connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  getConnectionStatus,
  mongoose
};
