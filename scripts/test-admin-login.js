const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login process...');
    
    // Connect to MongoDB
    await connectDB();
    
    const username = 'admin';
    const password = 'admin123';
    
    console.log(`Attempting login with username: ${username}, password: ${password}`);
    
    // Find admin by username
    const admin = await Admin.findOne({ username, isActive: true });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    console.log('✅ Admin found:');
    console.log('  - Username:', admin.username);
    console.log('  - Is Active:', admin.isActive);
    console.log('  - Login Attempts:', admin.loginAttempts);
    console.log('  - Is Locked:', admin.isLocked());
    console.log('  - Lock Until:', admin.lockUntil);
    
    // Check if account is locked
    if (admin.isLocked()) {
      console.log('❌ Account is locked');
      return;
    }
    
    // Test password comparison
    console.log('🔐 Testing password comparison...');
    const isValidPassword = await admin.comparePassword(password);
    
    if (isValidPassword) {
      console.log('✅ Password is correct');
      console.log('✅ Login should succeed');
    } else {
      console.log('❌ Password is incorrect');
      console.log('❌ Login should fail');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testAdminLogin();