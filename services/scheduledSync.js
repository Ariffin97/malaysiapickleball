const TournamentSyncService = require('./tournamentSyncService');

class ScheduledSync {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
    this.lastSyncTime = null;
    this.nextSyncTime = null;
    this.syncIntervalMinutes = 2; // Sync every 2 minutes for better reliability
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduled sync is already running');
      return;
    }

    console.log(`🕒 Starting scheduled tournament sync (every ${this.syncIntervalMinutes} minutes)`);
    
    // Run initial sync after 2 minutes to allow server to fully start
    setTimeout(() => {
      this.performSync();
    }, 2 * 60 * 1000);

    // Set up recurring sync
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.syncIntervalMinutes * 60 * 1000);

    this.isRunning = true;
    this.updateNextSyncTime();
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Scheduled tournament sync stopped');
  }

  async performSync() {
    try {
      console.log('🔄 Scheduled tournament sync started...');
      this.lastSyncTime = new Date();
      
      const syncService = new TournamentSyncService();
      const result = await syncService.syncTournaments();
      await syncService.cleanup();
      
      console.log(`✅ Scheduled sync completed: ${result.synced} synced, ${result.skipped} skipped, ${result.deleted || 0} deleted, ${result.errors.length} errors`);
      
      if (result.errors.length > 0) {
        console.error('⚠️  Sync errors:', result.errors);
      }
      
      this.updateNextSyncTime();
      
    } catch (error) {
      console.error('❌ Scheduled tournament sync failed:', error);
    }
  }

  updateNextSyncTime() {
    this.nextSyncTime = new Date(Date.now() + (this.syncIntervalMinutes * 60 * 1000));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.syncIntervalMinutes,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.nextSyncTime
    };
  }

  setSyncInterval(minutes) {
    if (minutes < 5) {
      throw new Error('Sync interval must be at least 5 minutes');
    }
    
    this.syncIntervalMinutes = minutes;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    
    console.log(`🕒 Sync interval updated to ${minutes} minutes`);
  }
}

// Create singleton instance
const scheduledSync = new ScheduledSync();

module.exports = scheduledSync;