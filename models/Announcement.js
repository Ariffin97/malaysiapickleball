const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  announcementId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['news', 'event', 'maintenance', 'policy', 'feature', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'players', 'admins'],
    default: 'all'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  publishedBy: {
    type: String,
    required: true // Admin ID
  },
  publishedByName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: false // null for no expiration
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }],
  metadata: {
    link: String,
    actionRequired: Boolean,
    category: String
  }
}, {
  timestamps: true
});

// Generate unique announcement ID
announcementSchema.statics.generateAnnouncementId = async function() {
  const lastAnnouncement = await this.findOne({}, {}, { sort: { 'announcementId': -1 } });
  
  if (!lastAnnouncement) {
    return 'ANN0001';
  }
  
  const lastNumber = parseInt(lastAnnouncement.announcementId.substring(3));
  const nextNumber = lastNumber + 1;
  return `ANN${String(nextNumber).padStart(4, '0')}`;
};

// Get active announcements
announcementSchema.statics.getActiveAnnouncements = async function(targetAudience = 'all', page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const query = {
      isActive: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: targetAudience }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    const announcements = await this.find(query)
      .sort({ isPinned: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await this.countDocuments(query);
    
    return {
      announcements,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error getting announcements:', error);
    throw error;
  }
};

// Get pinned announcements
announcementSchema.statics.getPinnedAnnouncements = async function(targetAudience = 'all') {
  try {
    const query = {
      isActive: true,
      isPinned: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: targetAudience }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    return await this.find(query)
      .sort({ publishedAt: -1 })
      .limit(5);
  } catch (error) {
    console.error('Error getting pinned announcements:', error);
    throw error;
  }
};

module.exports = mongoose.model('Announcement', announcementSchema); 