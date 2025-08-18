const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');

async function createAdminUser() {
  try {
    console.log('🚀 Checking/Creating admin user...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Check if admin user already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Username:', existingAdmin.username);
      console.log('Full Name:', existingAdmin.fullName);
      console.log('Email:', existingAdmin.email);
      console.log('Is Active:', existingAdmin.isActive);
      console.log('Role:', existingAdmin.role);
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin account
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
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\n🔐 Admin Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Login URL: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdminUser();