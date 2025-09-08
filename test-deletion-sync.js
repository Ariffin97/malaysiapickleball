const TournamentSyncService = require('./services/tournamentSyncService');

async function testDeletionSync() {
  console.log('🧪 Testing tournament deletion sync...');
  
  const syncService = new TournamentSyncService();
  
  try {
    // Run the sync process which now includes deletion checking
    console.log('🔄 Running sync with deletion checking...');
    const result = await syncService.syncTournaments();
    
    console.log('📊 Sync Results:');
    console.log(`  - Synced: ${result.synced}`);
    console.log(`  - Skipped: ${result.skipped}`);
    console.log(`  - Deleted: ${result.deleted || 0}`);
    console.log(`  - Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.tournament || 'Unknown'}: ${error.error}`);
      });
    }
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    // Clean up connections
    await syncService.cleanup();
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
testDeletionSync();