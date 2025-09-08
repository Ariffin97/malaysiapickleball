// Quick fix script to link tournaments without Portal IDs
const mongoose = require('mongoose');

async function quickFixPortalIds() {
  console.log('🔧 Quick fix: Linking tournaments with missing Portal IDs...');
  
  try {
    // Connect to both databases
    const portalConn = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-portal-dev');
    const websiteConn = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-dev');

    const TournamentApplication = portalConn.model('tournamentapplications', new mongoose.Schema({
      applicationId: String,
      eventTitle: String,
      status: String
    }));

    const Tournament = websiteConn.model('tournaments', new mongoose.Schema({
      name: String,
      portalApplicationId: String,
      managedByPortal: Boolean,
      syncedFromPortal: Boolean
    }));

    // Find tournaments without Portal IDs
    const tournamentsWithoutPortalId = await Tournament.find({
      portalApplicationId: { $exists: false }
    });

    console.log(`Found ${tournamentsWithoutPortalId.length} tournaments without Portal ID`);

    for (const tournament of tournamentsWithoutPortalId) {
      // Find matching portal tournament by name
      const portalTournament = await TournamentApplication.findOne({
        eventTitle: tournament.name,
        status: 'Approved'
      });

      if (portalTournament) {
        await Tournament.findByIdAndUpdate(tournament._id, {
          portalApplicationId: portalTournament.applicationId,
          managedByPortal: true,
          syncedFromPortal: true
        });
        
        console.log(`✅ Linked "${tournament.name}" with Portal ID: ${portalTournament.applicationId}`);
      } else {
        console.log(`⚠️  No matching portal tournament found for: ${tournament.name}`);
      }
    }

    await portalConn.close();
    await websiteConn.close();
    
    console.log('🎉 Quick fix completed!');
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
  }
}

quickFixPortalIds().then(() => process.exit(0));