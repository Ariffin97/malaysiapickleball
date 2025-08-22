const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  schedule: [{
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    }
  }],
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'elite']
  },
  levelRange: {
    type: String,
    required: true // e.g., "2.0 - 2.5"
  },
  maxParticipants: {
    type: Number,
    required: true,
    default: 8
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  instructor: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    bio: String
  },
  venue: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    court: String
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'MYR'
    }
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'full', 'cancelled', 'completed'],
    default: 'draft'
  },
  prerequisites: [String],
  materials: [String],
  certification: {
    offered: {
      type: Boolean,
      default: false
    },
    type: String,
    requirements: [String]
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  participants: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'waitlist', 'attended', 'completed', 'cancelled'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Index for efficient date-based queries
courseSchema.index({ 'schedule.date': 1 });
courseSchema.index({ startDate: 1, endDate: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });

// Virtual for checking if course is active
courseSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'open' && 
         this.registrationDeadline > now && 
         this.currentParticipants < this.maxParticipants;
});

// Virtual for available spots
courseSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.currentParticipants;
});

// Method to get upcoming sessions
courseSchema.methods.getUpcomingSessions = function() {
  const now = new Date();
  return this.schedule.filter(session => session.date >= now);
};

// Static method to find courses by date range
courseSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    'schedule.date': {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['open', 'full'] }
  });
};

module.exports = mongoose.model('Course', courseSchema);