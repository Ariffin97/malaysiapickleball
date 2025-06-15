const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true,
    required: true
  },
  recipientId: {
    type: String,
    required: true,
    ref: 'Player'
  },
  recipientType: {
    type: String,
    enum: ['player', 'admin'],
    default: 'player'
  },
  senderId: {
    type: String,
    required: false // Can be null for system messages
  },
  senderType: {
    type: String,
    enum: ['admin', 'system'],
    default: 'system'
  },
  senderName: {
    type: String,
    default: 'Malaysia Pickleball Association'
  },
  subject: {
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
    enum: ['notification', 'announcement', 'tournament', 'approval', 'general'],
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
  readAt: {
    type: Date,
    required: false
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }],
  metadata: {
    tournamentId: String,
    registrationId: String,
    playerId: String
  }
}, {
  timestamps: true
});

// Generate unique message ID
messageSchema.statics.generateMessageId = async function() {
  const lastMessage = await this.findOne({}, {}, { sort: { 'messageId': -1 } });
  
  if (!lastMessage) {
    return 'MSG0001';
  }
  
  const lastNumber = parseInt(lastMessage.messageId.substring(3));
  const nextNumber = lastNumber + 1;
  return `MSG${String(nextNumber).padStart(4, '0')}`;
};

// Get unread count for a player
messageSchema.statics.getUnreadCount = async function(playerId) {
  try {
    return await this.countDocuments({ 
      recipientId: playerId, 
      recipientType: 'player',
      isRead: false 
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
  }
  return this;
};

// Get messages for a player with pagination
messageSchema.statics.getPlayerMessages = async function(playerId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const messages = await this.find({ 
      recipientId: playerId, 
      recipientType: 'player' 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await this.countDocuments({ 
      recipientId: playerId, 
      recipientType: 'player' 
    });
    
    return {
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error getting player messages:', error);
    throw error;
  }
};

module.exports = mongoose.model('Message', messageSchema); 