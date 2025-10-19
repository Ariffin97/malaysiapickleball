import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function findExtraTournament() {
  try {
    console.log('═'.repeat(80));
    console.log('🔍 FINDING EXTRA TOURNAMENT IN MPA-DATABASE');
    console.log('═'.repeat(80));
    console.log('');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const client = mongoose.connection.client;

    // Get Portal tournaments
    const portalDb = client.db('malaysia-pickleball-portal');
    const portalApps = portalDb.collection('tournamentapplications');
    const portalTournaments = await portalApps.find({ status: 'Approved' }).toArray();

    console.log(`📊 Portal: ${portalTournaments.length} approved tournaments`);

    // Get MPA-database tournaments
    const mpaDb = client.db('MPA-database');
    const mpaTournaments = mpaDb.collection('tournaments');
    const appTournaments = await mpaTournaments.find({ status: 'Approved' }).toArray();

    console.log(`📊 MPA-database: ${appTournaments.length} approved tournaments\n`);

    console.log(`➕ Difference: ${appTournaments.length - portalTournaments.length} extra in MPA-database\n`);

    // Create map of portal applicationIds
    const portalAppIds = new Set(portalTournaments.map(t => t.applicationId));

    console.log('─'.repeat(80));
    console.log('🔎 Checking each MPA-database tournament against Portal...');
    console.log('─'.repeat(80));
    console.log('');

    const extraTournaments = [];

    for (const tournament of appTournaments) {
      const appId = tournament.applicationId;

      if (!portalAppIds.has(appId)) {
        extraTournaments.push(tournament);
        console.log(`❌ NOT IN PORTAL: ${tournament.name}`);
        console.log(`   Application ID: ${appId}`);
        console.log(`   Status: ${tournament.status}`);
        console.log(`   Start Date: ${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'N/A'}`);
        console.log(`   Database ID: ${tournament._id}`);
        console.log(`   Created: ${tournament.createdAt ? new Date(tournament.createdAt).toLocaleString() : 'N/A'}`);
        console.log(`   Last Synced: ${tournament.lastSyncedAt ? new Date(tournament.lastSyncedAt).toLocaleString() : 'N/A'}`);
        console.log('');
      }
    }

    if (extraTournaments.length === 0) {
      console.log('✅ All MPA-database tournaments exist in Portal!\n');
      return;
    }

    console.log('═'.repeat(80));
    console.log('💡 FOUND EXTRA TOURNAMENTS');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Found ${extraTournaments.length} tournament(s) in MPA-database that DON'T exist in Portal:\n`);

    extraTournaments.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name}`);
      console.log(`   Application ID: ${t.applicationId}`);
      console.log(`   This should be deleted from MPA-database`);
      console.log('');
    });

    // Offer to delete
    console.log('─'.repeat(80));
    console.log('🗑️  DELETION CONFIRMATION');
    console.log('─'.repeat(80));
    console.log('');
    console.log('These tournaments will be PERMANENTLY DELETED from MPA-database:');
    console.log('');

    for (const tournament of extraTournaments) {
      await mpaTournaments.deleteOne({ _id: tournament._id });
      console.log(`✅ Deleted: ${tournament.name} (${tournament.applicationId})`);
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('✅ CLEANUP COMPLETE');
    console.log('═'.repeat(80));
    console.log('');

    // Final count
    const finalCount = await mpaTournaments.countDocuments({ status: 'Approved' });
    console.log(`📊 Final Count: ${finalCount} approved tournaments in MPA-database`);
    console.log(`📊 Portal Count: ${portalTournaments.length} approved tournaments`);
    console.log('');

    if (finalCount === portalTournaments.length) {
      console.log('✅ Perfect! MPA-database now matches the Portal exactly!');
    } else {
      console.log('⚠️  Still a mismatch. May need to run tournament sync.');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

findExtraTournament();
