const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingAdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: ['manage_tournaments', 'manage_players', 'manage_coaches', 'manage_referees', 'view_analytics']
  }],
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  requestedByUsername: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  approvedAt: {
    type: Date,
    required: false
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  rejectedAt: {
    type: Date,
    required: false
  },
  rejectionReason: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Hash password before saving
pendingAdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to approve the pending admin
pendingAdminSchema.methods.approve = async function(approvedByAdminId) {
  this.status = 'approved';
  this.approvedBy = approvedByAdminId;
  this.approvedAt = new Date();
  return await this.save();
};

// Instance method to reject the pending admin
pendingAdminSchema.methods.reject = async function(rejectedByAdminId, rejectionReason = '') {
  this.status = 'rejected';
  this.rejectedBy = rejectedByAdminId;
  this.rejectedAt = new Date();
  this.rejectionReason = rejectionReason;
  return await this.save();
};

module.exports = mongoose.model('PendingAdmin', pendingAdminSchema); 