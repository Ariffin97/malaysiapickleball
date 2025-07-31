const mongoose = require('mongoose');
const Settings = require('../models/Settings');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysiapickleball', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function restoreDefaultSettings() {
  try {
    console.log('🔧 Restoring default settings...\n');

    const defaultSettings = [
      // Homepage Settings
      { key: 'background_image', value: '/images/defaultbg.png', description: 'Default homepage background image', category: 'appearance' },
      { key: 'popup_active', value: false, description: 'Whether popup messages are active', category: 'appearance' },
      { key: 'popup_title', value: '', description: 'Popup message title', category: 'appearance' },
      { key: 'popup_content', value: '', description: 'Popup message content', category: 'appearance' },
      { key: 'popup_image', value: null, description: 'Popup message image', category: 'appearance' },
      { key: 'homepage_video_1', value: null, description: 'First homepage video embed code', category: 'appearance' },
      { key: 'homepage_video_2', value: null, description: 'Second homepage video embed code', category: 'appearance' },
      { key: 'homepage_video_1_type', value: 'Featured Video', description: 'Type of first homepage video', category: 'appearance' },
      { key: 'homepage_video_2_type', value: 'Featured Video', description: 'Type of second homepage video', category: 'appearance' },
      { key: 'homepage_video_1_original', value: null, description: 'Original embed code for first video', category: 'appearance' },
      { key: 'homepage_video_2_original', value: null, description: 'Original embed code for second video', category: 'appearance' },

      // Live Tournament Settings
      { key: 'live_tournament_max_streams', value: 2, description: 'Maximum number of live streams', category: 'tournament' },
      { key: 'live_tournament_status', value: 'inactive', description: 'Current live tournament status', category: 'tournament' },
      { key: 'live_tournament_title', value: '', description: 'Live tournament title', category: 'tournament' },
      { key: 'live_stream_1', value: null, description: 'First live stream embed code', category: 'tournament' },
      { key: 'live_stream_1_original', value: '', description: 'Original first live stream code', category: 'tournament' },
      { key: 'live_stream_1_title', value: 'Live Stream 1', description: 'Title for first live stream', category: 'tournament' },
      { key: 'live_stream_1_status', value: 'offline', description: 'Status of first live stream', category: 'tournament' },
      { key: 'live_stream_2', value: null, description: 'Second live stream embed code', category: 'tournament' },
      { key: 'live_stream_2_original', value: '', description: 'Original second live stream code', category: 'tournament' },
      { key: 'live_stream_2_title', value: 'Live Stream 2', description: 'Title for second live stream', category: 'tournament' },
      { key: 'live_stream_2_status', value: 'offline', description: 'Status of second live stream', category: 'tournament' },
      { key: 'live_stream_3', value: null, description: 'Third live stream embed code', category: 'tournament' },
      { key: 'live_stream_3_original', value: '', description: 'Original third live stream code', category: 'tournament' },
      { key: 'live_stream_3_title', value: 'Live Stream 3', description: 'Title for third live stream', category: 'tournament' },
      { key: 'live_stream_3_status', value: 'offline', description: 'Status of third live stream', category: 'tournament' },
      { key: 'live_stream_4', value: null, description: 'Fourth live stream embed code', category: 'tournament' },
      { key: 'live_stream_4_original', value: '', description: 'Original fourth live stream code', category: 'tournament' },
      { key: 'live_stream_4_title', value: 'Live Stream 4', description: 'Title for fourth live stream', category: 'tournament' },
      { key: 'live_stream_4_status', value: 'offline', description: 'Status of fourth live stream', category: 'tournament' },

      // General System Settings
      { key: 'site_title', value: 'Malaysia Pickleball Association', description: 'Website title', category: 'general' },
      { key: 'site_description', value: 'Official website of the Malaysia Pickleball Association', description: 'Website description', category: 'general' },
      { key: 'contact_email', value: 'info@malaysiapickleball.org', description: 'Contact email address', category: 'general' },
      { key: 'contact_phone', value: '+60 3-1234 5678', description: 'Contact phone number', category: 'general' },
      { key: 'social_facebook', value: '', description: 'Facebook page URL', category: 'general' },
      { key: 'social_twitter', value: '', description: 'Twitter profile URL', category: 'general' },
      { key: 'social_instagram', value: '', description: 'Instagram profile URL', category: 'general' },
      { key: 'social_youtube', value: '', description: 'YouTube channel URL', category: 'general' },

      // Email Settings
      { key: 'smtp_host', value: '', description: 'SMTP server host', category: 'email' },
      { key: 'smtp_port', value: 587, description: 'SMTP server port', category: 'email' },
      { key: 'smtp_user', value: '', description: 'SMTP username', category: 'email' },
      { key: 'smtp_pass', value: '', description: 'SMTP password', category: 'email' },
      { key: 'email_from', value: 'noreply@malaysiapickleball.org', description: 'Default sender email', category: 'email' },
      { key: 'email_from_name', value: 'Malaysia Pickleball Association', description: 'Default sender name', category: 'email' },

      // Security Settings
      { key: 'session_timeout', value: 3600, description: 'Session timeout in seconds', category: 'security' },
      { key: 'max_login_attempts', value: 5, description: 'Maximum login attempts', category: 'security' },
      { key: 'password_min_length', value: 8, description: 'Minimum password length', category: 'security' },
      { key: 'require_email_verification', value: false, description: 'Require email verification for registration', category: 'security' },

      // Tournament Settings
      { key: 'default_tournament_status', value: 'draft', description: 'Default status for new tournaments', category: 'tournament' },
      { key: 'tournament_registration_deadline_days', value: 7, description: 'Days before tournament deadline', category: 'tournament' },
      { key: 'max_tournament_participants', value: 64, description: 'Maximum participants per tournament', category: 'tournament' },
      { key: 'tournament_categories', value: JSON.stringify(['Local', 'State', 'National', 'International']), description: 'Available tournament categories', category: 'tournament' },

      // Player Settings
      { key: 'player_registration_enabled', value: true, description: 'Enable player registration', category: 'player' },
      { key: 'player_verification_required', value: true, description: 'Require player verification', category: 'player' },
      { key: 'player_profile_public', value: true, description: 'Make player profiles public', category: 'player' },
      { key: 'player_ranking_enabled', value: true, description: 'Enable player ranking system', category: 'player' }
    ];

    console.log(`📝 Restoring ${defaultSettings.length} default settings...\n`);

    let restored = 0;
    let skipped = 0;

    for (const setting of defaultSettings) {
      try {
        const existingSetting = await Settings.findOne({ key: setting.key });
        
        if (existingSetting) {
          console.log(`⏭️  ${setting.key}: Already exists, skipping`);
          skipped++;
        } else {
          await Settings.setSetting(
            setting.key, 
            setting.value, 
            setting.description, 
            setting.category, 
            'system_restore'
          );
          console.log(`✅ ${setting.key}: Restored`);
          restored++;
        }
      } catch (error) {
        console.error(`❌ ${setting.key}: Error - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESTORATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Settings Restored: ${restored}`);
    console.log(`Settings Skipped: ${skipped}`);
    console.log(`Total Processed: ${restored + skipped}`);

    if (restored > 0) {
      console.log('\n✅ Default settings have been restored!');
      console.log('\n🔧 Next Steps:');
      console.log('1. Start your server');
      console.log('2. Go to Admin Dashboard');
      console.log('3. Use "Manage Homepage" to configure homepage settings');
      console.log('4. Check other admin pages for additional configurations');
    } else {
      console.log('\nℹ️  All settings already exist or no new settings were restored.');
    }

  } catch (error) {
    console.error('❌ Error restoring settings:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the restoration
restoreDefaultSettings(); 