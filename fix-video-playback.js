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

async function fixVideoPlayback() {
  try {
    console.log('🔧 Fixing video playback issues...');
    
    // Get current video embed codes
    const video1 = await Setting.findOne({ key: 'homepage_video_1' });
    const video2 = await Setting.findOne({ key: 'homepage_video_2' });
    
    if (video1 && video1.value) {
      console.log('📺 Updating Video 1 embed code...');
      
      // Extract video ID from current embed code
      const videoIdMatch = video1.value.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        
        // Create new embed code with proper parameters for interaction
        const newEmbedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&fs=1&origin=${encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        
        // Update the embed code
        await Setting.findOneAndUpdate(
          { key: 'homepage_video_1' },
          { value: newEmbedCode, updatedAt: new Date() },
          { new: true }
        );
        
        console.log('✅ Video 1 updated successfully!');
      }
    }
    
    if (video2 && video2.value) {
      console.log('📺 Updating Video 2 embed code...');
      
      // Extract video ID from current embed code
      const videoIdMatch = video2.value.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        
        // Create new embed code with proper parameters for interaction
        const newEmbedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&fs=1&origin=${encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        
        // Update the embed code
        await Setting.findOneAndUpdate(
          { key: 'homepage_video_2' },
          { value: newEmbedCode, updatedAt: new Date() },
          { new: true }
        );
        
        console.log('✅ Video 2 updated successfully!');
      }
    }
    
    console.log('🎉 Video playback should now work!');
    console.log('🌐 Refresh your homepage to see the changes.');
    
  } catch (error) {
    console.error('❌ Error fixing video playback:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixVideoPlayback(); 