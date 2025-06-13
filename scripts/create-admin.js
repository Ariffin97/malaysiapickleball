const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');

async function createAdmin() {
  try {
    console.log('🚀 Creating admin account...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      return;
    }
    
    // Create default admin account
    console.log('👤 Creating default admin account...');
    const admin = new Admin({
      username: 'admin',
      password: 'admin123', // This will be automatically hashed
      fullName: 'System Administrator',
      email: 'admin@malaysiapickleball.com',
      role: 'super_admin',
      permissions: [
        'manage_tournaments', 
        'manage_players', 
        'manage_coaches', 
        'manage_referees', 
        'manage_admins', 
        'view_analytics'
      ],
      isActive: true
    });
    await admin.save();
    console.log('✅ Default admin account created successfully!');
    
    console.log('\n🔐 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@malaysiapickleball.com');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin }; 