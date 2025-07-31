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

async function addTestVideos() {
  try {
    console.log('🎬 Adding test video embed codes...');
    
    // Sample YouTube embed codes
    const video1Embed = `<iframe width="560" height="315" src="https://www.youtube.com/embed/kUK1mrmZYL4?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&fs=1" title="Johns/Tardio vs Staksrud/Patriquin at the Select Medical Orange County Cup" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    
    const video2Embed = `<iframe width="560" height="315" src="https://www.youtube.com/embed/zRTx-AFnpz4?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&fs=1" title="B.Johns/Tardio vs Johnson/Klinger at the Veolia Atlanta Pickleball Championships" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    
    // Update video settings
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
    
    console.log('✅ Test videos added successfully!');
    console.log('📺 Video 1: Johns/Tardio vs Staksrud/Patriquin');
    console.log('📺 Video 2: B.Johns/Tardio vs Johnson/Klinger');
    
  } catch (error) {
    console.error('❌ Error adding test videos:', error);
  } finally {
    mongoose.connection.close();
  }
}

addTestVideos(); 