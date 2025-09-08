// Force start the scheduled sync - run this whenever server restarts
const scheduledSync = require('./services/scheduledSync');

console.log('🔧 Force starting scheduled tournament sync...');

try {
  // Stop any existing sync first
  scheduledSync.stop();
  console.log('🛑 Stopped any existing sync');
  
  // Wait a moment
  setTimeout(() => {
    // Start the sync
    scheduledSync.start();
    console.log('✅ Scheduled sync started successfully');
    
    const status = scheduledSync.getStatus();
    console.log('📊 Status:');
    console.log(`  - Running: ${status.isRunning}`);
    console.log(`  - Interval: ${status.intervalMinutes} minutes`);
    console.log(`  - Next sync: ${status.nextSyncTime ? status.nextSyncTime.toISOString() : 'Not scheduled'}`);
    
    console.log('\n🎉 Automatic tournament deletion is now active!');
    console.log('   - Syncs every 2 minutes');
    console.log('   - Automatically deletes tournaments removed from portal');
    
    process.exit(0);
  }, 1000);
  
} catch (error) {
  console.error('❌ Failed to start sync:', error.message);
  process.exit(1);
}