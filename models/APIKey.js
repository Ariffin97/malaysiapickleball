const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  keyId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return crypto.randomBytes(8).toString('hex');
    }
  },
  keyHash: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  permissions: [{
    type: String,
    enum: ['unregistered-player', 'player-details', 'players-list'],
    required: true
  }],
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedBy: {
    type: String,
    default: null
  }
});

// Index for faster lookups
apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ isActive: 1 });
apiKeySchema.index({ createdAt: -1 });

// Static method to generate API key
apiKeySchema.statics.generateAPIKey = function() {
  // Generate a 64-character API key
  const prefix = 'mpba_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
};

// Static method to hash API key
apiKeySchema.statics.hashAPIKey = function(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Instance method to check if key has permission
apiKeySchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Instance method to update last used
apiKeySchema.methods.updateUsage = async function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
};

// Instance method to revoke key
apiKeySchema.methods.revoke = async function(revokedBy) {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  await this.save();
};

module.exports = mongoose.model('APIKey', apiKeySchema);