require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔄 Testing MongoDB Connection...');
console.log('📍 URI:', process.env.MONGO_URI.substring(0, 60) + '...');

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB Connection Successful!');
    console.log('✅ Database:', process.env.MONGO_URI.split('/').pop());
    console.log('✅ You can now run: node server.js');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify IP whitelist includes 0.0.0.0/0');
    console.error('2. Check username and password in .env');
    console.error('3. Ensure database name is correct');
    console.error('4. Check internet connection');
    process.exit(1);
  });

setTimeout(() => {
  console.error('❌ Connection timeout - MongoDB not responding');
  process.exit(1);
}, 15000);
