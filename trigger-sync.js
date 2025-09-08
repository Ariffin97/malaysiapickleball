const TournamentSyncService = require('./services/tournamentSyncService');

async function triggerImmediateSync() {
  console.log('🚀 Triggering immediate tournament sync...');
  
  const syncService = new TournamentSyncService();
  
  try {
    const result = await syncService.syncTournaments();
    console.log('✅ Sync completed:', result);
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await syncService.cleanup();
    process.exit(0);
  }
}

triggerImmediateSync();