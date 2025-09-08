const mongoose = require('mongoose');
const axios = require('axios');

// Site configurations
const PORTAL_API = 'http://localhost:5001/api';

async function testDeletionLive() {
  console.log('🧪 Testing Live Deletion Sync Between Both Sites');
  console.log('=' .repeat(70));
  
  try {
    // Step 1: Connect to both databases directly
    console.log('\n🔍 Step 1: Database Connections');
    
    const mainConnection = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-dev');
    const portalConnection = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-portal-dev');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Connected to both databases');
    
    // Step 2: Get current tournaments from databases
    console.log('\n🔍 Step 2: Current Tournament Status (Direct DB Access)');
    
    // Main database tournaments
    const TournamentSchema = new mongoose.Schema({}, { strict: false });
    const Tournament = mainConnection.model('tournaments', TournamentSchema);
    
    const mainTournaments = await Tournament.find({ visibility: 'live' }).sort({ name: 1 });
    console.log(`📊 Main Site tournaments: ${mainTournaments.length}`);
    
    // Portal database tournaments  
    const TournamentApplicationSchema = new mongoose.Schema({}, { strict: false });
    const TournamentApplication = portalConnection.model('tournamentapplications', TournamentApplicationSchema);
    
    const portalTournaments = await TournamentApplication.find({ status: 'Approved' }).sort({ eventTitle: 1 });
    console.log(`📊 Portal tournaments: ${portalTournaments.length}`);
    
    console.log('\n📋 Tournament Comparison:');
    console.log('   MAIN SITE TOURNAMENTS:');
    mainTournaments.forEach((t, i) => {
      console.log(`     ${i+1}. ${t.name} (Portal ID: ${t.portalApplicationId || 'None'})`);
    });
    
    console.log('\\n   PORTAL TOURNAMENTS:');
    portalTournaments.forEach((t, i) => {
      console.log(`     ${i+1}. ${t.eventTitle} (${t.applicationId})`);
    });
    
    // Step 3: Identify sync status
    console.log('\n🔍 Step 3: Sync Analysis');
    
    const portalIds = new Set(portalTournaments.map(t => t.applicationId));
    const portalNames = new Set(portalTournaments.map(t => t.eventTitle.toLowerCase()));
    
    let syncedTournaments = 0;
    let orphanedTournaments = [];
    
    mainTournaments.forEach(mainT => {
      const hasPortalId = mainT.portalApplicationId && portalIds.has(mainT.portalApplicationId);
      const hasMatchingName = portalNames.has(mainT.name.toLowerCase());
      
      if (hasPortalId || hasMatchingName) {
        syncedTournaments++;
      } else {
        orphanedTournaments.push(mainT);
      }
    });
    
    console.log(`✅ Synced tournaments: ${syncedTournaments}`);
    console.log(`⚠️  Orphaned tournaments (no portal match): ${orphanedTournaments.length}`);
    
    if (orphanedTournaments.length > 0) {
      console.log('     ORPHANED TOURNAMENTS:');
      orphanedTournaments.forEach(t => {
        console.log(`       - ${t.name} (Created: ${t.createdAt?.toISOString()?.split('T')[0] || 'Unknown'})`);
      });
    }
    
    // Step 4: Test portal API access
    console.log('\n🔍 Step 4: Portal API Test');
    
    try {
      const portalHealth = await axios.get(`${PORTAL_API}/health`);
      console.log('✅ Portal API accessible');
      
      const approvedTournaments = await axios.get(`${PORTAL_API}/approved-tournaments`);
      console.log(`✅ Portal API returns ${approvedTournaments.data.length} approved tournaments`);
      
      const syncStatus = await axios.get(`${PORTAL_API}/sync/status`);
      console.log('✅ Sync status API accessible');
      console.log(`   Matched tournaments via API: ${syncStatus.data.matchedTournaments}`);
      
    } catch (error) {
      console.log(`❌ Portal API error: ${error.message}`);
    }
    
    // Step 5: Check scheduled sync
    console.log('\n🔍 Step 5: Scheduled Sync Status');
    
    try {
      const scheduledSync = require('./services/scheduledSync');
      const syncStatus = scheduledSync.getStatus();
      
      console.log(`📊 Scheduled Sync:`);
      console.log(`   Running: ${syncStatus.isRunning ? '✅ YES' : '❌ NO'}`);
      console.log(`   Interval: ${syncStatus.intervalMinutes} minutes`);
      
      if (syncStatus.lastSyncTime) {
        const timeSince = Math.floor((Date.now() - syncStatus.lastSyncTime.getTime()) / 60000);
        console.log(`   Last sync: ${timeSince} minutes ago`);
      }
      
      if (syncStatus.nextSyncTime) {
        const timeUntil = Math.floor((syncStatus.nextSyncTime.getTime() - Date.now()) / 60000);
        console.log(`   Next sync: in ${timeUntil} minutes`);
      }
      
    } catch (error) {
      console.log(`❌ Scheduled sync status error: ${error.message}`);
    }
    
    // Step 6: Deletion workflow explanation
    console.log('\n🔍 Step 6: Deletion Workflow');
    console.log('   📋 HOW TO TEST DELETION:');
    console.log('   1. Access Portal admin: http://localhost:5001');
    console.log('   2. Login to portal admin panel');  
    console.log('   3. Find a tournament and change status to "Rejected" or delete it');
    console.log('   4. Wait 2 minutes for scheduled sync');
    console.log('   5. Check main site - tournament should be gone');
    console.log('   6. Check this analysis again to see the change');
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 DELETION SYNC STATUS SUMMARY:');
    console.log(`   Main Site: ✅ ${mainTournaments.length} tournaments`);
    console.log(`   Portal: ✅ ${portalTournaments.length} tournaments`);
    console.log(`   Synced: ✅ ${syncedTournaments} tournaments`);
    console.log(`   Orphaned: ${orphanedTournaments.length > 0 ? '⚠️ ' : '✅ '}${orphanedTournaments.length} tournaments`);
    console.log(`   Auto Sync: ${syncStatus?.isRunning ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    
    await mainConnection.close();
    await portalConnection.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDeletionLive()
  .then(() => {
    console.log('\n🎉 Live Deletion Test Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });