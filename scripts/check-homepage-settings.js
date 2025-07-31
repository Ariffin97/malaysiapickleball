const mongoose = require('mongoose');
const Settings = require('../models/Settings');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysiapickleball', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkHomepageSettings() {
  try {
    console.log('🔍 Checking homepage settings...\n');

    // List of homepage-related settings to check
    const homepageSettings = [
      'background_image',
      'popup_active',
      'popup_title',
      'popup_content',
      'popup_image',
      'homepage_video_1',
      'homepage_video_2',
      'homepage_video_1_type',
      'homepage_video_2_type',
      'homepage_video_1_original',
      'homepage_video_2_original'
    ];

    console.log('📋 Checking for homepage settings:');
    console.log('=====================================');

    for (const settingKey of homepageSettings) {
      const setting = await Settings.findOne({ key: settingKey });
      if (setting) {
        console.log(`✅ ${settingKey}: ${setting.value ? 'Set' : 'Empty'}`);
      } else {
        console.log(`❌ ${settingKey}: Missing`);
      }
    }

    console.log('\n📊 Summary:');
    console.log('============');
    
    const existingSettings = await Settings.find({ 
      key: { $in: homepageSettings } 
    });
    
    console.log(`Found ${existingSettings.length} out of ${homepageSettings.length} homepage settings`);
    
    if (existingSettings.length < homepageSettings.length) {
      console.log('\n⚠️  Some settings are missing. You may need to reconfigure your homepage.');
      console.log('\n🔧 To restore settings:');
      console.log('1. Go to Admin Dashboard');
      console.log('2. Click "Manage Homepage" (orange button)');
      console.log('3. Reconfigure your background image, videos, and popup settings');
    } else {
      console.log('\n✅ All homepage settings are present!');
    }

    // Show current values for debugging
    console.log('\n📝 Current Homepage Settings:');
    console.log('==============================');
    
    for (const setting of existingSettings) {
      const value = setting.value;
      const displayValue = typeof value === 'string' && value.length > 50 
        ? value.substring(0, 50) + '...' 
        : value;
      console.log(`${setting.key}: ${displayValue}`);
    }

  } catch (error) {
    console.error('❌ Error checking homepage settings:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
checkHomepageSettings(); 