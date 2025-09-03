const mongoose = require('mongoose');

const unregisteredPlayerSchema = new mongoose.Schema({
  mpaId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'converted', 'expired'],
    default: 'pending'
  },
  source: {
    type: String,
    default: 'api'
  },
  apiKeyUsed: {
    type: String,
    required: false
  },
  convertedToPlayerId: {
    type: String,
    required: false
  },
  convertedAt: {
    type: Date,
    required: false
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Set expiration to 6 months from creation
      return new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);
    }
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
unregisteredPlayerSchema.index({ mpaId: 1 });
unregisteredPlayerSchema.index({ status: 1 });
unregisteredPlayerSchema.index({ expiresAt: 1 });
unregisteredPlayerSchema.index({ createdAt: -1 });

// Static method to clean up expired records
unregisteredPlayerSchema.statics.cleanupExpired = async function() {
  try {
    const result = await this.updateMany(
      { 
        expiresAt: { $lt: new Date() },
        status: 'pending'
      },
      { 
        status: 'expired' 
      }
    );
    return result;
  } catch (error) {
    console.error('Error cleaning up expired unregistered players:', error);
    throw error;
  }
};

// Static method to get statistics
unregisteredPlayerSchema.statics.getStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      total: 0,
      pending: 0,
      converted: 0,
      expired: 0
    };
    
    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting unregistered player stats:', error);
    throw error;
  }
};

// Instance method to mark as converted
unregisteredPlayerSchema.methods.markAsConverted = async function(playerId) {
  this.status = 'converted';
  this.convertedToPlayerId = playerId;
  this.convertedAt = new Date();
  return await this.save();
};

// Pre-save middleware to ensure MPA ID format
unregisteredPlayerSchema.pre('save', function(next) {
  if (this.isNew && this.mpaId && !this.mpaId.startsWith('MPA')) {
    this.mpaId = 'MPA' + this.mpaId;
  }
  next();
});

module.exports = mongoose.model('UnregisteredPlayer', unregisteredPlayerSchema);