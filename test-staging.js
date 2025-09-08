const mongoose = require('mongoose');
const TournamentStagingService = require('./services/tournamentStagingService');

async function testStaging() {
  try {
    console.log('🧪 Testing Tournament Staging System...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/malaysia-pickleball-dev');
    
    const stagingService = new TournamentStagingService();
    
    // Migrate existing tournaments
    await stagingService.migrateExistingTournaments();
    
    // Get staging stats
    const stats = await stagingService.getStagingStats();
    console.log('📊 Staging Stats:', stats);
    
    // Get tournaments by status
    const byStatus = await stagingService.getTournamentsByStatus();
    console.log('📋 By Status:');
    console.log(`   Live: ${byStatus.live.length}`);
    console.log(`   Staging: ${byStatus.staging.length}`);
    console.log(`   Ready: ${byStatus.ready.length}`);
    
    // Process any staging tournaments
    await stagingService.processAllStagingTournaments();
    
    await mongoose.disconnect();
    console.log('✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStaging().then(() => process.exit(0));