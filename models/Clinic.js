const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['serve-return', 'net-play', 'strategic-play', 'doubles-tactics', 'general-skills', 'fitness', 'mental-game']
  },
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
  },
  level: {
    type: String,
    required: true,
    enum: ['all', 'beginner', 'intermediate', 'advanced', 'elite']
  },
  levelRange: {
    type: String // e.g., "All levels" or "3.0 - 4.0"
  },
  maxParticipants: {
    type: Number,
    required: true,
    default: 12
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
    bio: String,
    credentials: [String]
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
  focusAreas: [String], // e.g., ["serves", "volleys", "positioning"]
  equipment: [String], // e.g., ["paddles provided", "bring your own balls"]
  dropInAllowed: {
    type: Boolean,
    default: true
  },
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
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
    },
    isDropIn: {
      type: Boolean,
      default: false
    }
  }],
  feedback: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient date-based queries
clinicSchema.index({ date: 1 });
clinicSchema.index({ type: 1 });
clinicSchema.index({ level: 1 });
clinicSchema.index({ status: 1 });

// Virtual for checking if clinic is active
clinicSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'open' && 
         this.registrationDeadline > now && 
         this.currentParticipants < this.maxParticipants;
});

// Virtual for available spots
clinicSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.currentParticipants;
});

// Virtual for checking if clinic is upcoming
clinicSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Virtual for average rating
clinicSchema.virtual('averageRating').get(function() {
  if (this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((total, fb) => total + fb.rating, 0);
  return (sum / this.feedback.length).toFixed(1);
});

// Static method to find clinics by date range
clinicSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['open', 'full'] }
  });
};

// Static method to find clinics by type
clinicSchema.statics.findByType = function(type) {
  return this.find({
    type: type,
    status: { $in: ['open', 'full'] },
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

module.exports = mongoose.model('Clinic', clinicSchema);