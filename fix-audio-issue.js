const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysiapickleball', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Setting schema
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  category: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Setting = mongoose.model('Setting', settingSchema);

async function fixAudioIssue() {
  try {
    console.log('🔊 Fixing audio issues with YouTube embeds...');
    
    // Embed codes with proper audio parameters
    const video1Embed = `<iframe width="560" height="315" src="https://www.youtube.com/embed/kUK1mrmZYL4?enablejsapi=1&origin=${encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')}&widget_referrer=${encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    
    const video2Embed = `<iframe width="560" height="315" src="https://www.youtube.com/embed/zRTx-AFnpz4?enablejsapi=1&origin=${encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')}&widget_referrer=${encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    
    // Update video settings with audio-fixed embed codes
    await Setting.findOneAndUpdate(
      { key: 'homepage_video_1' },
      { 
        key: 'homepage_video_1',
        value: video1Embed,
        description: 'First homepage video embed code',
        category: 'appearance'
      },
      { upsert: true, new: true }
    );
    
    await Setting.findOneAndUpdate(
      { key: 'homepage_video_1_original' },
      { 
        key: 'homepage_video_1_original',
        value: video1Embed,
        description: 'Original embed code for first video',
        category: 'appearance'
      },
      { upsert: true, new: true }
    );
    
    await Setting.findOneAndUpdate(
      { key: 'homepage_video_2' },
      { 
        key: 'homepage_video_2',
        value: video2Embed,
        description: 'Second homepage video embed code',
        category: 'appearance'
      },
      { upsert: true, new: true }
    );
    
    await Setting.findOneAndUpdate(
      { key: 'homepage_video_2_original' },
      { 
        key: 'homepage_video_2_original',
        value: video2Embed,
        description: 'Original embed code for second video',
        category: 'appearance'
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Audio-fixed video embed codes created successfully!');
    console.log('🔊 Audio should now work properly');
    console.log('🌐 Refresh your homepage to test the audio!');
    
  } catch (error) {
    console.error('❌ Error fixing audio:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAudioIssue(); 