const { connectDB } = require('../config/database');
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const PlayerRegistration = require('../models/PlayerRegistration');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

// Existing data from your current server.js
const existingData = {
  tournaments: [
    { name: 'Kuching Open', startDate: '2025-01-15', endDate: '2025-01-17', type: 'local', months: [0], image: null },
    { name: 'MPR@KL (SUKMA)', startDate: '2025-04-26', endDate: '2025-04-28', type: 'state', months: [3], image: null },
    { name: 'SPA Grand Finals', startDate: '2025-11-10', endDate: '2025-11-12', type: 'national', months: [10], image: null },
    { name: 'IOP Johor', startDate: '2025-03-20', endDate: '2025-03-22', type: 'wmalaysia', months: [2], image: null }
  ],
  tournamentTypes: {
    local: { color: 'green', label: 'Local' },
    state: { color: 'red', label: 'State' },
    national: { color: 'blue', label: 'National' },
    
  },
  adminCredentials: {
    username: 'admin',
    password: 'admin123' // This will be hashed
  }
};

async function migrateData() {
  try {
    console.log('🚀 Starting data migration to MongoDB...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await Tournament.deleteMany({});
    await Player.deleteMany({});
    await PlayerRegistration.deleteMany({});
    await Admin.deleteMany({});
    await Settings.deleteMany({});
    
    // Migrate tournaments
    console.log('📅 Migrating tournaments...');
    for (const tournamentData of existingData.tournaments) {
      const tournament = new Tournament({
        ...tournamentData,
        color: existingData.tournamentTypes[tournamentData.type]?.color || 'blue'
      });
      await tournament.save();
      console.log(`✅ Tournament migrated: ${tournament.name}`);
    }
    
    // Create default admin account
    console.log('👤 Creating default admin account...');
    const admin = new Admin({
      username: existingData.adminCredentials.username,
      password: existingData.adminCredentials.password,
      fullName: 'System Administrator',
      role: 'super_admin',
      permissions: ['manage_tournaments', 'manage_players', 'manage_coaches', 'manage_referees', 'manage_admins', 'view_analytics'],
      isActive: true
    });
    await admin.save();
    console.log('✅ Default admin account created');
    
    // Migrate settings
    console.log('⚙️ Creating default settings...');
    const defaultSettings = [
      { key: 'site_name', value: 'Malaysia Pickleball Association', category: 'general', description: 'Website name' },
      { key: 'background_image', value: '/images/defaultbg.png', category: 'appearance', description: 'Default background image' },
      { key: 'popup_message', value: '', category: 'general', description: 'Homepage popup message' },
      { key: 'tournament_registration_open', value: true, category: 'tournament', description: 'Allow tournament registrations' },
      { key: 'player_registration_open', value: true, category: 'player', description: 'Allow player registrations' },
      { key: 'max_login_attempts', value: 5, category: 'security', description: 'Maximum login attempts before lockout' },
      { key: 'session_timeout', value: 7200000, category: 'security', description: 'Session timeout in milliseconds (2 hours)' }
    ];
    
    for (const setting of defaultSettings) {
      await Settings.setSetting(setting.key, setting.value, setting.description, setting.category, 'migration');
    }
    console.log('✅ Default settings created');
    
    console.log('🎉 Data migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   Tournaments: ${await Tournament.countDocuments()}`);
    console.log(`   Players: ${await Player.countDocuments()}`);
    console.log(`   Pending Registrations: ${await PlayerRegistration.countDocuments()}`);
    console.log(`   Admins: ${await Admin.countDocuments()}`);
    console.log(`   Settings: ${await Settings.countDocuments()}`);
    
    console.log('\n🔐 Default Admin Credentials:');
    console.log(`   Username: ${existingData.adminCredentials.username}`);
    console.log(`   Password: ${existingData.adminCredentials.password}`);
    console.log('\n⚠️  Please change the default admin password after first login!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 