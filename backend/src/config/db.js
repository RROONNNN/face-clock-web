const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  const options = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    appName: 'face-clock-backend',
    autoIndex: env.NODE_ENV !== 'production',
    // Node.js 25 / OpenSSL 3.x compatibility with MongoDB Atlas
    tls: true,
    tlsAllowInvalidCertificates: env.NODE_ENV !== 'production',
  };

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    console.log(`✅ MongoDB đã kết nối: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;