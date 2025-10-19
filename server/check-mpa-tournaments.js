import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkTournaments() {
  try {
    console.log('═'.repeat(80));
    console.log('🏆 MPA-DATABASE TOURNAMENTS REPORT');
    console.log('═'.repeat(80));
    console.log('');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MPA-database\n');

    const db = mongoose.connection.client.db('MPA-database');
    const tournamentsCollection = db.collection('tournaments');

    const allTournaments = await tournamentsCollection.find({}).toArray();
    console.log(`📊 Total tournaments in database: ${allTournaments.length}\n`);

    // Group by status
    const byStatus = {};
    allTournaments.forEach(t => {
      const status = t.status || 'Unknown';
      if (!byStatus[status]) {
        byStatus[status] = [];
      }
      byStatus[status].push(t);
    });

    console.log('─'.repeat(80));
    console.log('📋 BY STATUS:');
    console.log('─'.repeat(80));
    console.log('');

    Object.keys(byStatus).sort().forEach(status => {
      console.log(`${status}: ${byStatus[status].length} tournaments`);
    });

    console.log('');
    console.log('─'.repeat(80));
    console.log('📝 ALL TOURNAMENTS (sorted by start date):');
    console.log('─'.repeat(80));
    console.log('');

    const sorted = allTournaments.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
      return dateB - dateA;
    });

    sorted.forEach((t, index) => {
      const status = t.status || 'Unknown';
      const statusBadge = status === 'Approved' ? '✅' : status === 'Pending Review' ? '⏳' : '❓';

      console.log(`${index + 1}. ${statusBadge} ${t.name || t.eventTitle || 'Unnamed'}`);
      console.log(`   Application ID: ${t.applicationId || 'N/A'}`);
      console.log(`   Status: ${status}`);
      console.log(`   Start Date: ${t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Venue: ${t.venue || 'N/A'}`);
      console.log(`   Created in DB: ${t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}`);
      console.log(`   Last Synced: ${t.lastSyncedAt ? new Date(t.lastSyncedAt).toLocaleString() : 'N/A'}`);
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Total Tournaments: ${allTournaments.length}`);
    console.log(`Approved: ${byStatus['Approved']?.length || 0}`);
    console.log(`Pending Review: ${byStatus['Pending Review']?.length || 0}`);
    console.log(`Other Statuses: ${allTournaments.length - (byStatus['Approved']?.length || 0) - (byStatus['Pending Review']?.length || 0)}`);
    console.log('');

    // Check for duplicates
    const applicationIds = allTournaments.map(t => t.applicationId).filter(Boolean);
    const uniqueIds = new Set(applicationIds);

    if (applicationIds.length !== uniqueIds.size) {
      console.log('⚠️  WARNING: Duplicate applicationIds detected!');
      const duplicates = applicationIds.filter((id, index) => applicationIds.indexOf(id) !== index);
      console.log(`   Duplicates: ${[...new Set(duplicates)].join(', ')}`);
    } else {
      console.log('✅ No duplicate applicationIds found');
    }
    console.log('');

    console.log('💡 NEXT STEPS:');
    console.log('   1. Manually compare this list with your MPA Portal');
    console.log('   2. Count approved tournaments in the Portal');
    console.log(`   3. If Portal has ${byStatus['Approved']?.length || 0} approved tournaments, they match!`);
    console.log('   4. If different, identify which tournaments are missing or extra');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

checkTournaments();
