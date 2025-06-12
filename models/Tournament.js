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
    enum: ['local', 'state', 'national', 'sarawak', 'wmalaysia']
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
  registrationOpen: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema); 