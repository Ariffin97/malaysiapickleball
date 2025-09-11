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
  },
  
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  
  // Additional tournament fields
  state: {
    type: String,
    required: false
  },
  maxParticipants: {
    type: Number,
    required: false
  },
  contactEmail: {
    type: String,
    required: false
  },
  contactPhone: {
    type: String,
    required: false
  },
  registrationNo: {
    type: String,
    required: false
  },
  organisingPartner: {
    type: String,
    required: false
  },
  classification: {
    type: String,
    required: false
  },
  eventSummary: {
    type: String,
    required: false
  },
  scoringFormat: {
    type: String,
    required: false
  },
  
  // Portal integration fields
  managedByPortal: {
    type: Boolean,
    default: false
  },
  portalApplicationId: {
    type: String,
    required: false
  },
  portalTournamentId: {
    type: String,
    required: false
  },
  source: {
    type: String,
    enum: ['local', 'portal', 'api-key'],
    default: 'local'
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