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
  gender: {
    type: String,
    required: false,
    enum: ['Male', 'Female']
  },
  addressLine1: {
    type: String,
    required: false,
    trim: true
  },
  addressLine2: {
    type: String,
    required: false,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true
  },
  state: {
    type: String,
    required: false,
    trim: true
  },
  postcode: {
    type: String,
    required: false,
    trim: true
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

// Check if IC number is already in registration system (only pending registrations)
playerRegistrationSchema.statics.isIcNumberInSystem = async function(icNumber) {
  try {
    // Only check for pending registrations, not approved or rejected
    const existingRegistration = await this.findOne({
      icNumber,
      status: 'pending'
    });
    return !!existingRegistration;
  } catch (error) {
    console.error('Error checking IC number in registration system:', error);
    throw error;
  }
};

module.exports = mongoose.model('PlayerRegistration', playerRegistrationSchema); 