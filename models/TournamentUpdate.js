const mongoose = require('mongoose');

const tournamentUpdateSchema = new mongoose.Schema({
  updateId: {
    type: String,
    unique: true,
    required: true
  },
  tournamentId: {
    type: String,
    required: true,
    ref: 'Tournament'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['schedule', 'venue', 'registration', 'results', 'cancellation', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  publishedBy: {
    type: String,
    required: true // Admin ID
  },
  publishedByName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    affectedPlayers: [String], // Player IDs
    scheduleChanges: Object,
    venueChanges: Object
  }
}, {
  timestamps: true
});

// Generate unique update ID
tournamentUpdateSchema.statics.generateUpdateId = async function() {
  const lastUpdate = await this.findOne({}, {}, { sort: { 'updateId': -1 } });
  
  if (!lastUpdate) {
    return 'TUP0001';
  }
  
  const lastNumber = parseInt(lastUpdate.updateId.substring(3));
  const nextNumber = lastNumber + 1;
  return `TUP${String(nextNumber).padStart(4, '0')}`;
};

// Get updates for a tournament
tournamentUpdateSchema.statics.getUpdatesForTournament = async function(tournamentId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const updates = await this.find({ 
      tournamentId, 
      isActive: true 
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await this.countDocuments({ 
      tournamentId, 
      isActive: true 
    });
    
    return {
      updates,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error getting tournament updates:', error);
    throw error;
  }
};

// Get all active tournament updates
tournamentUpdateSchema.statics.getAllActiveUpdates = async function(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const updates = await this.find({ 
      isActive: true 
    })
    .populate('tournamentId', 'name type startDate location')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await this.countDocuments({ 
      isActive: true 
    });
    
    return {
      updates,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error getting all tournament updates:', error);
    throw error;
  }
};

module.exports = mongoose.model('TournamentUpdate', tournamentUpdateSchema); 