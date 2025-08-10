const mongoose = require('mongoose');

const tournamentNoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  tournamentName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['date_change', 'cancellation', 'venue_change', 'registration_deadline', 'general'],
    default: 'general'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    originalDate: String,
    newDate: String,
    originalVenue: String,
    newVenue: String,
    reason: String,
    deadline: String
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdBy: {
    type: String,
    required: true
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
tournamentNoticeSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.increment();
  }
  next();
});

// Virtual for formatted type display
tournamentNoticeSchema.virtual('typeDisplay').get(function() {
  const typeMap = {
    'date_change': 'Date Change',
    'cancellation': 'Cancelled',
    'venue_change': 'Venue Change',
    'registration_deadline': 'Registration Deadline',
    'general': 'General Notice'
  };
  return typeMap[this.type] || this.type;
});

// Virtual for color class based on type
tournamentNoticeSchema.virtual('colorClass').get(function() {
  const colorMap = {
    'date_change': 'orange',
    'cancellation': 'red',
    'venue_change': 'blue',
    'registration_deadline': 'green',
    'general': 'gray'
  };
  return colorMap[this.type] || 'gray';
});

module.exports = mongoose.model('TournamentNotice', tournamentNoticeSchema); 