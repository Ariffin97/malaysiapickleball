const mongoose = require('mongoose');
const Settings = require('../models/Settings');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysiapickleball', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testVideoDisplay() {
  try {
    console.log('🎥 Testing video display settings...\n');

    // Get video settings
    const video1 = await Settings.getSetting('homepage_video_1', null);
    const video2 = await Settings.getSetting('homepage_video_2', null);
    const video1Type = await Settings.getSetting('homepage_video_1_type', 'Featured Video');
    const video2Type = await Settings.getSetting('homepage_video_2_type', 'Featured Video');

    console.log('📹 Current Video Settings:');
    console.log('==========================');
    console.log(`Video 1 (${video1Type}): ${video1 ? '✅ Set' : '❌ Not set'}`);
    console.log(`Video 2 (${video2Type}): ${video2 ? '✅ Set' : '❌ Not set'}`);

    if (video1) {
      console.log('\n🎬 Video 1 Content:');
      console.log('==================');
      console.log(video1.substring(0, 200) + (video1.length > 200 ? '...' : ''));
    }

    if (video2) {
      console.log('\n🎬 Video 2 Content:');
      console.log('==================');
      console.log(video2.substring(0, 200) + (video2.length > 200 ? '...' : ''));
    }

    if (!video1 && !video2) {
      console.log('\n⚠️  No videos are currently set!');
      console.log('\n🔧 To add videos:');
      console.log('1. Go to Admin Dashboard');
      console.log('2. Click "Manage Homepage" (orange button)');
      console.log('3. Scroll to "Homepage Video Management"');
      console.log('4. Add YouTube or Vimeo embed codes');
      console.log('5. Save the videos');
      console.log('6. Refresh your homepage');
      
      console.log('\n💡 Example YouTube embed code:');
      console.log('<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>');
    } else {
      console.log('\n✅ Videos are set! They should appear on your homepage.');
      console.log('\n🔍 If videos still don\'t show:');
      console.log('1. Check that the embed codes are valid');
      console.log('2. Make sure the videos allow embedding');
      console.log('3. Try refreshing the homepage');
    }

  } catch (error) {
    console.error('❌ Error testing video display:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testVideoDisplay(); 