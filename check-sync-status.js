const scheduledSync = require('./services/scheduledSync');

async function checkSyncStatus() {
  console.log('🔍 Checking scheduled sync status...');
  
  const status = scheduledSync.getStatus();
  
  console.log('📊 Scheduled Sync Status:');
  console.log(`  - Is Running: ${status.isRunning ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Interval: ${status.intervalMinutes} minutes`);
  console.log(`  - Last Sync: ${status.lastSyncTime ? status.lastSyncTime.toISOString() : 'Never'}`);
  console.log(`  - Next Sync: ${status.nextSyncTime ? status.nextSyncTime.toISOString() : 'Not scheduled'}`);
  
  if (!status.isRunning) {
    console.log('\n🚨 PROBLEM: Scheduled sync is NOT running!');
    console.log('🔧 Starting sync manually...');
    
    try {
      scheduledSync.start();
      console.log('✅ Sync started successfully');
      
      // Check status again
      const newStatus = scheduledSync.getStatus();
      console.log(`✅ Sync is now running: ${newStatus.isRunning}`);
      console.log(`⏰ Next sync at: ${newStatus.nextSyncTime.toISOString()}`);
      
    } catch (error) {
      console.error('❌ Failed to start sync:', error.message);
    }
  } else {
    console.log('\n✅ Scheduled sync is running properly');
    
    if (status.lastSyncTime) {
      const timeSinceLastSync = Date.now() - status.lastSyncTime.getTime();
      const minutesAgo = Math.floor(timeSinceLastSync / 60000);
      console.log(`⏰ Last sync was ${minutesAgo} minutes ago`);
    }
    
    if (status.nextSyncTime) {
      const timeToNextSync = status.nextSyncTime.getTime() - Date.now();
      const minutesUntilNext = Math.floor(timeToNextSync / 60000);
      console.log(`⏰ Next sync in ${minutesUntilNext} minutes`);
    }
  }
  
  process.exit(0);
}

checkSyncStatus();