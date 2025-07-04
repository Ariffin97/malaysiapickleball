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