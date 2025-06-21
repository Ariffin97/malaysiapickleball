const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true
  },
  recipientId: {
    type: String,
    required: false // null for global notifications
  },
  recipientType: {
    type: String,
    enum: ['player', 'admin', 'all'],
    default: 'all'
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
    enum: ['system', 'tournament', 'registration', 'maintenance', 'feature', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date,
    required: false // null for no expiration
  },
  metadata: {
    tournamentId: String,
    link: String,
    actionRequired: Boolean
  }
}, {
  timestamps: true
});

// Generate unique notification ID
notificationSchema.statics.generateNotificationId = async function() {
  const lastNotification = await this.findOne({}, {}, { sort: { 'notificationId': -1 } });
  
  if (!lastNotification) {
    return 'NOT0001';
  }
  
  const lastNumber = parseInt(lastNotification.notificationId.substring(3));
  const nextNumber = lastNumber + 1;
  return `NOT${String(nextNumber).padStart(4, '0')}`;
};

// Get notifications for a user
notificationSchema.statics.getNotificationsForUser = async function(userId, userType = 'player', page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const query = {
      $or: [
        { recipientType: 'all' },
        { recipientId: userId, recipientType: userType }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    const notifications = await this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await this.countDocuments(query);
    
    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Mark notification as read by user
notificationSchema.methods.markAsReadByUser = async function(userId) {
  const existingRead = this.readBy.find(r => r.userId === userId);
  if (!existingRead) {
    this.readBy.push({ userId, readAt: new Date() });
    return await this.save();
  }
  return this;
};

module.exports = mongoose.model('Notification', notificationSchema); 