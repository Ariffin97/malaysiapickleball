const mongoose = require('mongoose');

// MongoDB connection configuration
const connectDB = async () => {
  try {
    // MongoDB connection string - you can change this to your MongoDB Compass connection
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Close database connection
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

module.exports = { connectDB, closeDB }; 