const mongoose = require('mongoose');
const Settings = require('../models/Settings');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysiapickleball', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkAllSettings() {
  try {
    console.log('🔍 Checking ALL system settings...\n');

    // Define all possible settings by category
    const allSettings = {
      'Homepage Settings': [
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
      ],
      'Live Tournament Settings': [
        'live_tournament_max_streams',
        'live_tournament_status',
        'live_tournament_title',
        'live_stream_1',
        'live_stream_1_original',
        'live_stream_1_title',
        'live_stream_1_status',
        'live_stream_2',
        'live_stream_2_original',
        'live_stream_2_title',
        'live_stream_2_status',
        'live_stream_3',
        'live_stream_3_original',
        'live_stream_3_title',
        'live_stream_3_status',
        'live_stream_4',
        'live_stream_4_original',
        'live_stream_4_title',
        'live_stream_4_status'
      ],
      'General System Settings': [
        'site_title',
        'site_description',
        'contact_email',
        'contact_phone',
        'social_facebook',
        'social_twitter',
        'social_instagram',
        'social_youtube'
      ],
      'Email Settings': [
        'smtp_host',
        'smtp_port',
        'smtp_user',
        'smtp_pass',
        'email_from',
        'email_from_name'
      ],
      'Security Settings': [
        'session_timeout',
        'max_login_attempts',
        'password_min_length',
        'require_email_verification'
      ],
      'Tournament Settings': [
        'default_tournament_status',
        'tournament_registration_deadline_days',
        'max_tournament_participants',
        'tournament_categories'
      ],
      'Player Settings': [
        'player_registration_enabled',
        'player_verification_required',
        'player_profile_public',
        'player_ranking_enabled'
      ]
    };

    console.log('📊 SETTINGS STATUS REPORT');
    console.log('=========================\n');

    let totalSettings = 0;
    let missingSettings = 0;
    let foundSettings = 0;

    for (const [category, settings] of Object.entries(allSettings)) {
      console.log(`\n📋 ${category.toUpperCase()}:`);
      console.log('='.repeat(category.length + 3));
      
      let categoryFound = 0;
      let categoryMissing = 0;

      for (const settingKey of settings) {
        const setting = await Settings.findOne({ key: settingKey });
        if (setting) {
          console.log(`✅ ${settingKey}: ${setting.value ? 'Set' : 'Empty'}`);
          categoryFound++;
          foundSettings++;
        } else {
          console.log(`❌ ${settingKey}: Missing`);
          categoryMissing++;
          missingSettings++;
        }
        totalSettings++;
      }

      console.log(`\n📈 ${category}: ${categoryFound}/${settings.length} settings found`);
      
      if (categoryMissing > 0) {
        console.log(`⚠️  ${categoryMissing} settings missing - may need reconfiguration`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Settings Checked: ${totalSettings}`);
    console.log(`Settings Found: ${foundSettings}`);
    console.log(`Settings Missing: ${missingSettings}`);
    console.log(`Completion Rate: ${((foundSettings / totalSettings) * 100).toFixed(1)}%`);

    if (missingSettings > 0) {
      console.log('\n⚠️  MISSING SETTINGS DETECTED');
      console.log('='.repeat(30));
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Check Admin Dashboard for missing features');
      console.log('2. Reconfigure homepage settings via "Manage Homepage"');
      console.log('3. Check live tournament settings if needed');
      console.log('4. Review email and security configurations');
      console.log('5. Verify tournament and player settings');
      
      console.log('\n🎯 PRIORITY SETTINGS TO RESTORE:');
      console.log('- Homepage settings (background, videos, popups)');
      console.log('- Live tournament settings (if using live streams)');
      console.log('- Email settings (if sending notifications)');
      console.log('- Security settings (if custom security is needed)');
    } else {
      console.log('\n✅ ALL SETTINGS ARE PRESENT!');
    }

    // Show some example settings for reference
    console.log('\n📝 SAMPLE CURRENT SETTINGS:');
    console.log('='.repeat(30));
    
    const sampleSettings = await Settings.find().limit(5);
    for (const setting of sampleSettings) {
      const value = setting.value;
      const displayValue = typeof value === 'string' && value.length > 30 
        ? value.substring(0, 30) + '...' 
        : value;
      console.log(`${setting.key}: ${displayValue}`);
    }

  } catch (error) {
    console.error('❌ Error checking settings:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the comprehensive check
checkAllSettings(); 