const DatabaseService = require('./databaseService');

class AutoPromotionService {
  
  // Check if tournament has all required fields
  static isComplete(tournament) {
    return !!(
      tournament.portalApplicationId && 
      tournament.phoneNumber && 
      tournament.venue && 
      tournament.organizer
    );
  }

  // Promote completed tournaments from draft to live
  static async promoteCompletedTournaments() {
    try {
      console.log('🔄 Checking for tournaments ready to promote...');
      
      // Find draft tournaments
      const allTournaments = await DatabaseService.getAllTournaments();
      const draftTournaments = allTournaments.filter(t => t.visibility === 'draft');
      
      let promotedCount = 0;
      
      for (const tournament of draftTournaments) {
        if (this.isComplete(tournament)) {
          // Promote to live
          await DatabaseService.updateTournament(tournament._id, { 
            visibility: 'live' 
          });
          console.log(`✅ Auto-promoted "${tournament.name}" to live (all fields complete)`);
          promotedCount++;
        }
      }
      
      if (promotedCount > 0) {
        console.log(`🚀 Auto-promoted ${promotedCount} tournaments to live`);
      }
      
      return promotedCount;
      
    } catch (error) {
      console.error('❌ Error in auto-promotion:', error);
      return 0;
    }
  }
  
  // Run on server startup
  static async initialize() {
    console.log('🎯 Initializing Auto-Promotion Service...');
    
    // Run initial check
    await this.promoteCompletedTournaments();
    
    // Set up periodic check every 30 seconds
    setInterval(async () => {
      await this.promoteCompletedTournaments();
    }, 30000);
    
    console.log('✅ Auto-Promotion Service initialized');
  }
}

module.exports = AutoPromotionService;