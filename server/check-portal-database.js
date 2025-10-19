import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkPortalDatabase() {
  try {
    console.log('═'.repeat(80));
    console.log('🔍 MPA PORTAL DATABASE INVESTIGATION');
    console.log('═'.repeat(80));
    console.log('');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const client = mongoose.connection.client;
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();

    // Find portal-related databases
    const portalDatabases = databases.filter(db =>
      db.name.toLowerCase().includes('portal')
    );

    console.log('📊 Portal-Related Databases Found:\n');

    if (portalDatabases.length === 0) {
      console.log('❌ No portal-related databases found\n');
    } else {
      portalDatabases.forEach(db => {
        const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
        console.log(`   • ${db.name} (${sizeMB} MB)`);
      });
      console.log('');
    }

    // Check the main portal database
    const portalDbName = 'malaysia-pickleball-portal';
    console.log('─'.repeat(80));
    console.log(`📋 Checking: ${portalDbName}`);
    console.log('─'.repeat(80));
    console.log('');

    const portalDb = client.db(portalDbName);
    const collections = await portalDb.listCollections().toArray();

    if (collections.length === 0) {
      console.log('❌ No collections found in this database\n');
    } else {
      console.log(`Found ${collections.length} collection(s):\n`);

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const collection = portalDb.collection(collectionName);
        const count = await collection.countDocuments();

        const emoji = count > 0 ? '✅' : '⚪';
        console.log(`${emoji} ${collectionName.padEnd(35)} ${count.toString().padStart(6)} documents`);

        // Get sample for important collections
        if (count > 0 && ['tournaments', 'tournamentapplications', 'players', 'organizations'].includes(collectionName.toLowerCase())) {
          const sample = await collection.find({}).limit(2).toArray();
          console.log(`   Sample (first 2):`);
          sample.forEach((doc, i) => {
            if (collectionName === 'tournaments' || collectionName === 'tournamentapplications') {
              console.log(`     ${i + 1}. ${doc.eventTitle || doc.name || 'N/A'}`);
              console.log(`        Status: ${doc.status || 'N/A'}`);
              console.log(`        Application ID: ${doc.applicationId || 'N/A'}`);
            } else if (collectionName === 'players') {
              console.log(`     ${i + 1}. ${doc.fullName || 'N/A'} (${doc.email || 'N/A'})`);
            } else if (collectionName === 'organizations') {
              console.log(`     ${i + 1}. ${doc.name || 'N/A'}`);
            } else {
              console.log(`     ${i + 1}. Document ID: ${doc._id}`);
            }
          });
          console.log('');
        }
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('💡 SUMMARY');
    console.log('═'.repeat(80));
    console.log('');

    // Check for tournament applications
    if (collections.find(c => c.name === 'tournamentapplications')) {
      const tournamentApps = portalDb.collection('tournamentapplications');
      const approvedCount = await tournamentApps.countDocuments({ status: 'Approved' });
      const pendingCount = await tournamentApps.countDocuments({ status: 'Pending Review' });
      const totalCount = await tournamentApps.countDocuments();

      console.log('🏆 Tournament Applications in Portal Database:');
      console.log(`   Total: ${totalCount}`);
      console.log(`   Approved: ${approvedCount}`);
      console.log(`   Pending Review: ${pendingCount}`);
      console.log('');
    }

    // Check for tournaments
    if (collections.find(c => c.name === 'tournaments')) {
      const tournaments = portalDb.collection('tournaments');
      const approvedCount = await tournaments.countDocuments({ status: 'Approved' });
      const totalCount = await tournaments.countDocuments();

      console.log('🏆 Tournaments in Portal Database:');
      console.log(`   Total: ${totalCount}`);
      console.log(`   Approved: ${approvedCount}`);
      console.log('');
    }

    console.log('📝 Key Finding:');
    console.log(`   The MPA Portal uses the "${portalDbName}" database`);
    console.log('   This is SEPARATE from your main app database (MPA-database)');
    console.log('');
    console.log('🔄 Data Flow:');
    console.log('   Portal DB → Portal API → Your App Backend → MPA-database');
    console.log('   (Tournaments are synced from Portal to your app)');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

checkPortalDatabase();
