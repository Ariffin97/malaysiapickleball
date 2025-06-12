const mongoose = require('mongoose');

const playerRegistrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    unique: true,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  icNumber: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 12,
    max: 100
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    required: false
  },
  processedBy: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Generate unique registration ID
playerRegistrationSchema.statics.generateRegistrationId = async function() {
  const lastRegistration = await this.findOne({}, {}, { sort: { 'registrationId': -1 } });
  
  if (!lastRegistration) {
    return 'REG0001';
  }
  
  const lastNumber = parseInt(lastRegistration.registrationId.substring(3));
  const nextNumber = lastNumber + 1;
  return `REG${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('PlayerRegistration', playerRegistrationSchema); 