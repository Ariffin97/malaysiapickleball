require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Diagnostic Tool\n');

async function testConnection() {
  try {
    // Get MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI;
    
    console.log('📋 Connection Details:');
    console.log('='.repeat(50));
    
    if (!mongoURI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      console.log('💡 Make sure you have a .env file with MONGODB_URI set');
      return;
    }
    
    // Hide password in logs for security
    const safeURI = mongoURI.replace(/:([^:@]{1,})@/, ':****@');
    console.log(`🔗 MongoDB URI: ${safeURI}`);
    
    // Determine connection type
    if (mongoURI.includes('mongodb+srv://')) {
      console.log('🌐 Connection Type: MongoDB Atlas (Cloud)');
      console.log('📍 Database Location: Cloud');
    } else if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
      console.log('💻 Connection Type: Local MongoDB');
      console.log('📍 Database Location: Your Computer');
    } else {
      console.log('🔧 Connection Type: Custom MongoDB Server');
    }
    
    console.log('\n🔄 Testing Connection...');
    console.log('='.repeat(50));
    
    // Test connection with timeout
    const startTime = Date.now();
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });
    
    const connectionTime = Date.now() - startTime;
    
    console.log('✅ Connection Successful!');
    console.log(`⏱️  Connection Time: ${connectionTime}ms`);
    
    // Get connection details
    const connection = mongoose.connection;
    console.log(`🗄️  Database Name: ${connection.name}`);
    console.log(`🖥️  Host: ${connection.host}`);
    console.log(`🔌 Port: ${connection.port}`);
    console.log(`📊 Ready State: ${connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    // Test database operations
    console.log('\n🧪 Testing Database Operations...');
    console.log('='.repeat(50));
    
    // List collections
    const collections = await connection.db.listCollections().toArray();
    console.log(`📁 Collections Found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📋 Collection Names:');
      collections.forEach(col => {
        console.log(`   • ${col.name}`);
      });
    } else {
      console.log('📭 No collections found (database is empty)');
    }
    
    // Test write operation
    try {
      const testCollection = connection.db.collection('connection_test');
      const testDoc = {
        test: true,
        timestamp: new Date(),
        message: 'Connection test successful'
      };
      
      await testCollection.insertOne(testDoc);
      console.log('✅ Write Test: Successful');
      
      // Clean up test document
      await testCollection.deleteOne({ test: true });
      console.log('🧹 Cleanup: Test document removed');
      
    } catch (writeError) {
      console.log('❌ Write Test: Failed');
      console.log(`   Error: ${writeError.message}`);
    }
    
    // Connection summary
    console.log('\n📊 Connection Summary:');
    console.log('='.repeat(50));
    
    if (mongoURI.includes('mongodb+srv://')) {
      console.log('🎉 SUCCESS: Connected to MongoDB Atlas!');
      console.log('🌐 Your project is using cloud database');
      console.log('✅ Data will persist across deployments');
      console.log('✅ Accessible from anywhere');
      console.log('✅ Automatic backups included');
    } else {
      console.log('💻 Connected to Local MongoDB');
      console.log('⚠️  Data is stored on your computer only');
      console.log('⚠️  For Heroku deployment, you need MongoDB Atlas');
    }
    
  } catch (error) {
    console.log('❌ Connection Failed!');
    console.log('='.repeat(50));
    console.log(`Error: ${error.message}`);
    
    // Provide specific troubleshooting
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('• Check your internet connection');
      console.log('• Verify the MongoDB Atlas cluster is running');
      console.log('• Check if the hostname in connection string is correct');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('• Check your username and password in connection string');
      console.log('• Verify database user exists in MongoDB Atlas');
      console.log('• Ensure user has proper permissions');
    } else if (error.message.includes('IP not whitelisted')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('• Add your IP address to MongoDB Atlas whitelist');
      console.log('• Or allow access from anywhere (0.0.0.0/0)');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('• MongoDB service is not running');
      console.log('• Check if MongoDB is installed and started');
      console.log('• Verify the connection string and port');
    }
    
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
    
    console.log('\n📋 Next Steps:');
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://')) {
      console.log('✅ You are ready for Heroku deployment!');
      console.log('🚀 Run: git push heroku main');
    } else {
      console.log('🌐 To deploy to Heroku, set up MongoDB Atlas:');
      console.log('📖 Follow: HEROKU_DEPLOYMENT.md');
      console.log('🔧 Or run: node scripts/setup-heroku-mongodb.js');
    }
  }
}

// Check environment first
console.log('🔍 Environment Check:');
console.log('='.repeat(50));
console.log(`📁 Current Directory: ${process.cwd()}`);
console.log(`🌍 Node Environment: ${process.env.NODE_ENV || 'development'}`);

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
} else {
  console.log('⚠️  .env file not found');
  console.log('💡 Create .env file with MONGODB_URI for local testing');
}

console.log('');

// Run the test
testConnection().catch(console.error); 