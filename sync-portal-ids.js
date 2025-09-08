const mongoose = require('mongoose');

async function syncPortalIds() {
  try {
    console.log('🔄 Starting Portal ID sync process...');
    
    // Connect to both databases
    const portalConn = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-portal-dev');
    const websiteConn = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-dev');

    // Define schemas
    const tournamentApplicationSchema = new mongoose.Schema({
      applicationId: String,
      eventTitle: String,
      eventStartDate: Date,
      eventEndDate: Date,
      status: String,
      websiteTournamentId: String
    });

    const tournamentSchema = new mongoose.Schema({
      name: String,
      startDate: Date,
      endDate: Date,
      portalApplicationId: String,
      managedByPortal: Boolean,
      syncedFromPortal: Boolean
    });

    const TournamentApplication = portalConn.model('tournamentapplications', tournamentApplicationSchema);
    const Tournament = websiteConn.model('tournaments', tournamentSchema);

    // Get all approved tournaments from portal
    const portalTournaments = await TournamentApplication.find({ status: 'Approved' });
    console.log(`📋 Found ${portalTournaments.length} approved tournaments in portal`);

    // Get all tournaments from website
    const websiteTournaments = await Tournament.find({});
    console.log(`🌐 Found ${websiteTournaments.length} tournaments in website`);

    let fixed = 0;
    let duplicatesRemoved = 0;

    for (const portalTournament of portalTournaments) {
      // Find matching tournaments by name
      const matchingTournaments = websiteTournaments.filter(t => 
        t.name === portalTournament.eventTitle
      );

      if (matchingTournaments.length > 1) {
        // Multiple tournaments with same name - remove duplicates without Portal ID
        const tournamentsWithoutPortalId = matchingTournaments.filter(t => !t.portalApplicationId);
        const tournamentsWithPortalId = matchingTournaments.filter(t => t.portalApplicationId);

        if (tournamentsWithoutPortalId.length > 0) {
          console.log(`🗑️  Removing ${tournamentsWithoutPortalId.length} duplicate tournaments for "${portalTournament.eventTitle}"`);
          
          for (const duplicate of tournamentsWithoutPortalId) {
            await Tournament.deleteOne({ _id: duplicate._id });
            duplicatesRemoved++;
          }
        }

        // Update the remaining tournament with Portal ID if needed
        const remainingTournament = tournamentsWithPortalId[0] || matchingTournaments[0];
        if (remainingTournament && !remainingTournament.portalApplicationId) {
          await Tournament.updateOne(
            { _id: remainingTournament._id },
            {
              $set: {
                portalApplicationId: portalTournament.applicationId,
                managedByPortal: true,
                syncedFromPortal: true
              }
            }
          );
          console.log(`✅ Added Portal ID ${portalTournament.applicationId} to "${portalTournament.eventTitle}"`);
          fixed++;
        }

      } else if (matchingTournaments.length === 1) {
        // Single tournament - update if missing Portal ID
        const tournament = matchingTournaments[0];
        if (!tournament.portalApplicationId) {
          await Tournament.updateOne(
            { _id: tournament._id },
            {
              $set: {
                portalApplicationId: portalTournament.applicationId,
                managedByPortal: true,
                syncedFromPortal: true
              }
            }
          );
          console.log(`✅ Added Portal ID ${portalTournament.applicationId} to "${portalTournament.eventTitle}"`);
          fixed++;
        }
      }
    }

    console.log(`\n📊 Sync Results:`);
    console.log(`   ✅ Fixed Portal IDs: ${fixed}`);
    console.log(`   🗑️  Removed duplicates: ${duplicatesRemoved}`);
    
    // Close connections
    await portalConn.close();
    await websiteConn.close();
    console.log('✅ Portal ID sync completed successfully!');

  } catch (error) {
    console.error('❌ Error during Portal ID sync:', error);
  }
}

// Run the sync
syncPortalIds().then(() => process.exit(0));