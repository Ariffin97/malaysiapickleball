// CONCEPT: Tournament Staging System

// Tournament Schema Enhancement
const tournamentSchema = {
  name: String,
  portalApplicationId: String,
  phoneNumber: String,
  // ... other fields
  
  // NEW STAGING FIELDS
  displayStatus: {
    type: String,
    enum: ['staging', 'ready', 'live'],
    default: 'staging'
  },
  completenessCheck: {
    hasPortalId: { type: Boolean, default: false },
    hasPhoneNumber: { type: Boolean, default: false },
    hasAllRequiredFields: { type: Boolean, default: false },
    lastChecked: Date
  },
  stageLog: [{
    stage: String,
    timestamp: Date,
    details: String
  }]
};

// Staging Logic
class TournamentStagingService {
  
  // 1. When tournament is created/synced
  async stageTournament(tournamentData) {
    const tournament = await Tournament.create({
      ...tournamentData,
      displayStatus: 'staging'  // Hidden by default
    });
    
    // Run completeness check
    this.checkTournamentCompleteness(tournament._id);
    return tournament;
  }
  
  // 2. Check if tournament is complete
  async checkTournamentCompleteness(tournamentId) {
    const tournament = await Tournament.findById(tournamentId);
    
    const hasPortalId = !!tournament.portalApplicationId;
    const hasPhoneNumber = !!tournament.phoneNumber;
    const hasAllRequired = hasPortalId && hasPhoneNumber && tournament.venue && tournament.organizer;
    
    await Tournament.findByIdAndUpdate(tournamentId, {
      'completenessCheck.hasPortalId': hasPortalId,
      'completenessCheck.hasPhoneNumber': hasPhoneNumber,
      'completenessCheck.hasAllRequiredFields': hasAllRequired,
      'completenessCheck.lastChecked': new Date(),
      displayStatus: hasAllRequired ? 'ready' : 'staging'
    });
    
    if (hasAllRequired) {
      console.log(`✅ Tournament "${tournament.name}" is ready for display!`);
      this.promoteTournamentToLive(tournamentId);
    } else {
      console.log(`⏳ Tournament "${tournament.name}" still staging: Portal ID: ${hasPortalId}, Phone: ${hasPhoneNumber}`);
    }
  }
  
  // 3. Promote tournament to live
  async promoteTournamentToLive(tournamentId) {
    await Tournament.findByIdAndUpdate(tournamentId, {
      displayStatus: 'live',
      $push: {
        stageLog: {
          stage: 'promoted_to_live',
          timestamp: new Date(),
          details: 'Tournament complete and ready for display'
        }
      }
    });
  }
  
  // 4. Get only live tournaments for display
  async getLiveTournaments() {
    return await Tournament.find({ 
      displayStatus: 'live' 
    });
  }
  
  // 5. Get staging tournaments for admin monitoring
  async getStagingTournaments() {
    return await Tournament.find({
      displayStatus: { $in: ['staging', 'ready'] }
    });
  }
}

// Usage in Routes
app.get('/admin/tournaments', async (req, res) => {
  const stagingService = new TournamentStagingService();
  
  // Only show live tournaments to users
  const liveTournaments = await stagingService.getLiveTournaments();
  
  // Show staging tournaments to admin (optional)
  const stagingTournaments = await stagingService.getStagingTournaments();
  
  res.render('admin/tournaments', { 
    tournaments: liveTournaments,
    stagingTournaments: stagingTournaments  // For admin monitoring
  });
});

// Periodic staging check (every 30 seconds)
setInterval(async () => {
  const stagingService = new TournamentStagingService();
  const stagingTournaments = await Tournament.find({ displayStatus: 'staging' });
  
  for (const tournament of stagingTournaments) {
    await stagingService.checkTournamentCompleteness(tournament._id);
  }
}, 30000);