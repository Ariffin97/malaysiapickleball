// CONCEPT: Separate Staging Collection Approach

// Two Collections:
// 1. tournament_staging - Incomplete tournaments
// 2. tournaments - Complete tournaments (what users see)

class StagingCollectionService {
  
  // 1. Store in staging first
  async stageNewTournament(tournamentData) {
    const stagingTournament = await TournamentStaging.create({
      ...tournamentData,
      stagedAt: new Date(),
      promoted: false
    });
    
    console.log(`📝 Staged tournament: ${tournamentData.name}`);
    
    // Schedule completeness check
    setTimeout(() => {
      this.checkAndPromote(stagingTournament._id);
    }, 5000); // Check after 5 seconds
    
    return stagingTournament;
  }
  
  // 2. Check completeness and promote
  async checkAndPromote(stagingId) {
    const stagingTournament = await TournamentStaging.findById(stagingId);
    
    if (!stagingTournament || stagingTournament.promoted) return;
    
    const isComplete = this.isComplete(stagingTournament);
    
    if (isComplete) {
      // Move to live tournaments collection
      const liveTournament = await Tournament.create({
        ...stagingTournament.toObject(),
        _id: undefined,
        promotedAt: new Date(),
        stagedDuration: Date.now() - stagingTournament.stagedAt.getTime()
      });
      
      // Mark staging as promoted
      await TournamentStaging.findByIdAndUpdate(stagingId, { 
        promoted: true,
        promotedAt: new Date(),
        liveTournamentId: liveTournament._id
      });
      
      console.log(`🚀 Promoted tournament: ${stagingTournament.name} (staged for ${Date.now() - stagingTournament.stagedAt.getTime()}ms)`);
      
    } else {
      console.log(`⏳ Tournament still incomplete: ${stagingTournament.name}`);
      
      // Retry in 10 seconds
      setTimeout(() => {
        this.checkAndPromote(stagingId);
      }, 10000);
    }
  }
  
  // 3. Check if tournament is complete
  isComplete(tournament) {
    return tournament.portalApplicationId && 
           tournament.phoneNumber && 
           tournament.venue && 
           tournament.organizer;
  }
  
  // 4. Clean up old staging tournaments (older than 1 hour)
  async cleanupStaging() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    await TournamentStaging.deleteMany({
      stagedAt: { $lt: oneHourAgo },
      promoted: false
    });
  }
}

// Usage Benefits:
// - Users NEVER see incomplete tournaments
// - Admin can monitor staging collection if needed  
// - Clean separation of concerns
// - Easy to debug sync issues
// - Automatic cleanup of failed tournaments