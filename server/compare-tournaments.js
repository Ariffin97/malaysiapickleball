import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://portalmpa.com/api';

async function compareTournaments() {
  try {
    console.log('═'.repeat(80));
    console.log('🔍 TOURNAMENT COMPARISON: MPA Portal vs MPA-database');
    console.log('═'.repeat(80));
    console.log('');

    // Fetch from Portal API
    console.log('📡 Fetching approved tournaments from MPA Portal...');
    const portalResponse = await fetch(`${PORTAL_API_URL}/tournament-applications?status=Approved`);

    if (!portalResponse.ok) {
      throw new Error(`Portal API error: ${portalResponse.status} ${portalResponse.statusText}`);
    }

    const portalTournaments = await portalResponse.json();
    console.log(`✅ Found ${portalTournaments.length} approved tournaments in Portal\n`);

    // Connect to database
    console.log('📊 Connecting to MPA-database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.client.db('MPA-database');
    const tournamentsCollection = db.collection('tournaments');

    // Fetch from database
    const dbTournaments = await tournamentsCollection.find({}).toArray();
    console.log(`✅ Found ${dbTournaments.length} tournaments in MPA-database\n`);

    console.log('═'.repeat(80));
    console.log('📊 COMPARISON RESULTS');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Portal (Approved):  ${portalTournaments.length} tournaments`);
    console.log(`Database (All):     ${dbTournaments.length} tournaments`);
    console.log(`Difference:         ${dbTournaments.length - portalTournaments.length} extra in database`);
    console.log('');

    // Create maps for comparison
    const portalMap = new Map();
    portalTournaments.forEach(t => {
      portalMap.set(t.applicationId, t);
    });

    const dbMap = new Map();
    dbTournaments.forEach(t => {
      dbMap.set(t.applicationId, t);
    });

    // Find tournaments in Portal but not in Database
    const inPortalNotInDb = [];
    portalTournaments.forEach(t => {
      if (!dbMap.has(t.applicationId)) {
        inPortalNotInDb.push(t);
      }
    });

    // Find tournaments in Database but not in Portal
    const inDbNotInPortal = [];
    dbTournaments.forEach(t => {
      if (!portalMap.has(t.applicationId)) {
        inDbNotInPortal.push(t);
      }
    });

    // Report
    console.log('─'.repeat(80));
    console.log('🔍 DETAILED ANALYSIS');
    console.log('─'.repeat(80));
    console.log('');

    if (inPortalNotInDb.length > 0) {
      console.log(`⚠️  ${inPortalNotInDb.length} tournament(s) in PORTAL but NOT in DATABASE:`);
      console.log('   (These should be synced to database)\n');
      inPortalNotInDb.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.eventTitle || t.name}`);
        console.log(`      Application ID: ${t.applicationId}`);
        console.log(`      Status: ${t.status}`);
        console.log(`      Start Date: ${t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('✅ All Portal tournaments exist in Database\n');
    }

    if (inDbNotInPortal.length > 0) {
      console.log(`⚠️  ${inDbNotInPortal.length} tournament(s) in DATABASE but NOT in PORTAL:`);
      console.log('   (These may be deleted from Portal or duplicates)\n');
      inDbNotInPortal.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.name || t.eventTitle}`);
        console.log(`      Application ID: ${t.applicationId}`);
        console.log(`      Status: ${t.status || 'N/A'}`);
        console.log(`      Start Date: ${t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}`);
        console.log(`      Database ID: ${t._id}`);
        console.log(`      Created: ${t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('✅ All Database tournaments exist in Portal\n');
    }

    // Check for status mismatches
    console.log('─'.repeat(80));
    console.log('🔄 STATUS CHECK');
    console.log('─'.repeat(80));
    console.log('');

    const statusMismatches = [];
    dbTournaments.forEach(dbT => {
      const portalT = portalMap.get(dbT.applicationId);
      if (portalT) {
        const dbStatus = dbT.status;
        const portalStatus = portalT.status;
        if (dbStatus !== portalStatus) {
          statusMismatches.push({
            name: dbT.name || portalT.eventTitle,
            applicationId: dbT.applicationId,
            dbStatus,
            portalStatus
          });
        }
      }
    });

    if (statusMismatches.length > 0) {
      console.log(`⚠️  ${statusMismatches.length} tournament(s) with status mismatch:\n`);
      statusMismatches.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.name}`);
        console.log(`      Application ID: ${t.applicationId}`);
        console.log(`      Database: ${t.dbStatus}`);
        console.log(`      Portal:   ${t.portalStatus}`);
        console.log('');
      });
    } else {
      console.log('✅ All statuses match between Portal and Database\n');
    }

    // Summary and recommendation
    console.log('═'.repeat(80));
    console.log('💡 RECOMMENDATION');
    console.log('═'.repeat(80));
    console.log('');

    if (inDbNotInPortal.length > 0) {
      console.log('⚠️  You have tournaments in the database that are not in the Portal.');
      console.log('   This likely happened during the merge from "test" and "malaysia-pickleball".\n');
      console.log('   Options:');
      console.log('   1. Delete these extra tournaments from MPA-database');
      console.log('   2. Keep them if they are legitimate tournaments\n');
      console.log(`   To delete, you can use the applicationIds listed above.\n`);
    }

    if (inPortalNotInDb.length > 0) {
      console.log('⚠️  You have tournaments in the Portal that are missing from the database.');
      console.log('   Run a sync to fetch these tournaments:\n');
      console.log('   POST /api/tournaments/sync\n');
    }

    if (inDbNotInPortal.length === 0 && inPortalNotInDb.length === 0) {
      console.log('✅ Perfect sync! All tournaments match between Portal and Database.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

compareTournaments();
