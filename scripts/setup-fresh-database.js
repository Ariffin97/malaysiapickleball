const { connectDB } = require('../config/database');
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const PlayerRegistration = require('../models/PlayerRegistration');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

async function setupFreshDatabase() {
  try {
    console.log('🚀 Setting up fresh MongoDB database for Malaysia Pickleball...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Clear all existing data (fresh start)
    console.log('🧹 Clearing any existing data...');
    await Tournament.deleteMany({});
    await Player.deleteMany({});
    await PlayerRegistration.deleteMany({});
    await Admin.deleteMany({});
    await Settings.deleteMany({});
    console.log('✅ Database cleared');
    
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
    console.log('✅ Default admin account created');
    
    // Create default settings
    console.log('⚙️ Creating default application settings...');
    const defaultSettings = [
      { 
        key: 'site_name', 
        value: 'Malaysia Pickleball Association', 
        category: 'general', 
        description: 'Website name',
        isPublic: true
      },
      { 
        key: 'background_image', 
        value: '/images/defaultbg.png', 
        category: 'appearance', 
        description: 'Default background image',
        isPublic: true
      },
      { 
        key: 'popup_message', 
        value: '', 
        category: 'general', 
        description: 'Homepage popup message',
        isPublic: true
      },
      { 
        key: 'tournament_registration_open', 
        value: true, 
        category: 'tournament', 
        description: 'Allow tournament registrations',
        isPublic: false
      },
      { 
        key: 'player_registration_open', 
        value: true, 
        category: 'player', 
        description: 'Allow player registrations',
        isPublic: false
      },
      { 
        key: 'max_login_attempts', 
        value: 5, 
        category: 'security', 
        description: 'Maximum login attempts before lockout',
        isPublic: false
      },
      { 
        key: 'session_timeout', 
        value: 7200000, 
        category: 'security', 
        description: 'Session timeout in milliseconds (2 hours)',
        isPublic: false
      },
      {
        key: 'next_player_id',
        value: 1000,
        category: 'system',
        description: 'Next player ID number for MP#### format',
        isPublic: false
      },
      {
        key: 'next_registration_id',
        value: 1,
        category: 'system',
        description: 'Next registration ID number for REG#### format',
        isPublic: false
      }
    ];
    
    for (const setting of defaultSettings) {
      await Settings.setSetting(
        setting.key, 
        setting.value, 
        setting.description, 
        setting.category, 
        'system-setup'
      );
      
      // Update isPublic flag
      await Settings.findOneAndUpdate(
        { key: setting.key },
        { isPublic: setting.isPublic }
      );
    }
    console.log('✅ Default settings created');
    
    // Create database indexes for better performance
    console.log('📊 Creating database indexes...');
    
    // Player indexes
    await Player.collection.createIndex({ playerId: 1 }, { unique: true });
    await Player.collection.createIndex({ email: 1 }, { unique: true });
    await Player.collection.createIndex({ username: 1 }, { unique: true });
    await Player.collection.createIndex({ icNumber: 1 }, { unique: true });
    
    // Admin indexes
    await Admin.collection.createIndex({ username: 1 }, { unique: true });
    await Admin.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    
    // PlayerRegistration indexes
    await PlayerRegistration.collection.createIndex({ registrationId: 1 }, { unique: true });
    await PlayerRegistration.collection.createIndex({ status: 1 });
    await PlayerRegistration.collection.createIndex({ submittedAt: -1 });
    
    // Tournament indexes
    await Tournament.collection.createIndex({ type: 1 });
    await Tournament.collection.createIndex({ startDate: 1 });
    
    // Settings indexes
    await Settings.collection.createIndex({ key: 1 }, { unique: true });
    await Settings.collection.createIndex({ category: 1 });
    
    console.log('✅ Database indexes created');
    
    console.log('\n🎉 Fresh database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log(`   Tournaments: ${await Tournament.countDocuments()}`);
    console.log(`   Players: ${await Player.countDocuments()}`);
    console.log(`   Pending Registrations: ${await PlayerRegistration.countDocuments()}`);
    console.log(`   Admins: ${await Admin.countDocuments()}`);
    console.log(`   Settings: ${await Settings.countDocuments()}`);
    
    console.log('\n🔐 Default Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@malaysiapickleball.com');
    console.log('\n⚠️  IMPORTANT: Change the default admin password after first login!');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start your application: node server-new.js');
    console.log('2. Open MongoDB Compass and connect to: mongodb://localhost:27017');
    console.log('3. Browse the "malaysia-pickleball" database');
    console.log('4. Login to admin panel: http://localhost:3000/admin/dashboard');
    console.log('5. Change the default admin password');
    
  } catch (error) {
    console.error('❌ Fresh database setup failed:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupFreshDatabase();
}

module.exports = { setupFreshDatabase }; 