const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const playerSchema = new mongoose.Schema({
  playerId: {
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
    unique: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 12,
    max: 100
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  state: {
    type: String,
    required: false,
    trim: true,
    enum: [
      'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 
      'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 
      'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
    ]
  },
  division: {
    type: String,
    required: false,
    trim: true,
    enum: [
      'Youth (Under 16)', 'Junior (16-18)', 'Open (19-39)', 'Senior (40-49)', 
      'Masters (50-59)', 'Grand Masters (60+)', 'Professional'
    ]
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
    unique: true,
    lowercase: true,
    trim: true
  },
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
  profilePicture: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    required: false
  },
  tournaments: [{
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'cancelled'],
      default: 'registered'
    }
  }],
  ranking: {
    points: {
      type: Number,
      default: 0
    },
    position: {
      type: Number,
      required: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
playerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
playerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate unique 5-character alphanumeric player ID based on IC number
playerSchema.statics.generatePlayerId = async function(icNumber) {
  try {
    // Create a hash from the IC number
    const hash = crypto.createHash('sha256').update(icNumber).digest('hex');
    
    // Extract first 5 characters and convert to alphanumeric
    let playerId = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Use hash bytes to generate 5-character ID
    for (let i = 0; i < 5; i++) {
      const byte = parseInt(hash.substr(i * 2, 2), 16);
      playerId += chars[byte % chars.length];
    }
    
    // Check if this ID already exists (very unlikely but safety check)
    const existingPlayer = await this.findOne({ playerId });
    if (existingPlayer) {
      // If collision occurs, add a random suffix
      const randomSuffix = Math.floor(Math.random() * 10);
      playerId = playerId.substr(0, 4) + randomSuffix;
    }
    
    return playerId;
  } catch (error) {
    console.error('Error generating player ID:', error);
    throw error;
  }
};

// Check if IC number is already registered
playerSchema.statics.isIcNumberRegistered = async function(icNumber) {
  try {
    const existingPlayer = await this.findOne({ icNumber });
    return !!existingPlayer;
  } catch (error) {
    console.error('Error checking IC number:', error);
    throw error;
  }
};

module.exports = mongoose.model('Player', playerSchema); 