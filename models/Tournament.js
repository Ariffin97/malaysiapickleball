const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['local', 'state', 'national', 'international', 'sarawak', 'wmalaysia']
  },
  tier: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5  // 5 = non-ranked, used for legacy tournaments
  },
  months: [{
    type: Number,
    min: 0,
    max: 11
  }],
  image: {
    type: String,
    required: false
  },
  color: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  venue: {
    type: String,
    required: false,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true
  },
  organizer: {
    type: String,
    required: false,
    trim: true
  },
  personInCharge: {
    type: String,
    required: false,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  registrationOpen: {
    type: Boolean,
    default: true
  },
  state: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'ongoing', 'completed'],
    default: 'draft'
  },
  finalized: {
    type: Boolean,
    default: false
  },
  finalizedAt: {
    type: Date,
    required: false
  },
  finalizedBy: {
    type: String,
    required: false
  },
  divisionsOffered: [{
    type: String
  }],
  lastModifiedBy: {
    type: String,
    required: false
  },
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  optimisticConcurrency: true
});

// Pre-save middleware to increment version
tournamentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.increment();
  }
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema); 