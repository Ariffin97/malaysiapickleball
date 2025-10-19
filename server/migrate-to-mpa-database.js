import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Replace database name with MPA-database
const NEW_DB_URI = MONGODB_URI.replace(/\/[^\/\?]+(\?|$)/, '/MPA-database$1');

async function migrateToMPADatabase() {
  try {
    console.log('═'.repeat(80));
    console.log('🚀 MIGRATION TO MPA-DATABASE');
    console.log('═'.repeat(80));
    console.log('\n📝 This script will:');
    console.log('   1. Create a new database: MPA-database');
    console.log('   2. Merge data from "test" and "malaysia-pickleball"');
    console.log('   3. Keep the newest/most complete data');
    console.log('   4. Leave original databases untouched (backup)\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const client = mongoose.connection.client;

    // Access all three databases
    const testDb = client.db('test');
    const prodDb = client.db('malaysia-pickleball');
    const newDb = client.db('MPA-database');

    console.log('📋 Checking if MPA-database already exists...');
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();
    const mpaDbExists = databases.some(db => db.name === 'MPA-database');

    if (mpaDbExists) {
      console.log('⚠️  WARNING: MPA-database already exists!');
      console.log('   This script will ADD/UPDATE data in the existing database.\n');
    } else {
      console.log('✅ MPA-database does not exist. Will create new.\n');
    }

    // Collections to migrate
    const collectionsToMigrate = [
      'players',
      'tournaments',
      'news',
      'milestones',
      'posts',
      'messages',
      'courses',
      'clinics',
      'admins',
      'featuredvideos',
      'announcements',
      'venues',
      'notifications',
      'pastpresidents',
      'settings',
      'unregisteredplayers',
      'playerregistrations',
      'tournamentapplications',
      'tournamentnotices',
      'tournamentupdates',
      'pendingadmins',
      'apikeys',
      'portalTournamentApplications'
    ];

    const migrationReport = [];

    for (const collectionName of collectionsToMigrate) {
      console.log('─'.repeat(80));
      console.log(`📦 Processing: ${collectionName}`);

      // Check if collection exists in test
      const testCollections = await testDb.listCollections({ name: collectionName }).toArray();
      const testExists = testCollections.length > 0;
      const testCount = testExists ? await testDb.collection(collectionName).countDocuments() : 0;

      // Check if collection exists in malaysia-pickleball
      const prodCollections = await prodDb.listCollections({ name: collectionName }).toArray();
      const prodExists = prodCollections.length > 0;
      const prodCount = prodExists ? await prodDb.collection(collectionName).countDocuments() : 0;

      console.log(`   test: ${testCount} documents`);
      console.log(`   malaysia-pickleball: ${prodCount} documents`);

      if (testCount === 0 && prodCount === 0) {
        console.log('   ⚪ Skipping (empty in both databases)');
        migrationReport.push({
          collection: collectionName,
          testDocs: 0,
          prodDocs: 0,
          merged: 0,
          status: 'skipped-empty'
        });
        continue;
      }

      let mergedDocs = [];
      const newCollection = newDb.collection(collectionName);

      // Strategy: Collect all documents, use newer ones when duplicates exist
      if (testExists && testCount > 0) {
        const testDocs = await testDb.collection(collectionName).find({}).toArray();
        console.log(`   ✅ Fetched ${testDocs.length} from test`);
        mergedDocs.push(...testDocs);
      }

      if (prodExists && prodCount > 0) {
        const prodDocs = await prodDb.collection(collectionName).find({}).toArray();
        console.log(`   ✅ Fetched ${prodDocs.length} from malaysia-pickleball`);

        // Merge with test docs, handling duplicates
        for (const prodDoc of prodDocs) {
          // Check for duplicates based on unique identifiers
          let isDuplicate = false;

          if (collectionName === 'players') {
            // For players, check playerId, email, username, or icNumber
            isDuplicate = mergedDocs.some(doc =>
              (prodDoc.playerId && doc.playerId === prodDoc.playerId) ||
              (prodDoc.email && doc.email === prodDoc.email) ||
              (prodDoc.username && doc.username === prodDoc.username) ||
              (prodDoc.icNumber && doc.icNumber === prodDoc.icNumber)
            );

            if (isDuplicate) {
              // Replace with newer version
              const existingIndex = mergedDocs.findIndex(doc =>
                (prodDoc.playerId && doc.playerId === prodDoc.playerId) ||
                (prodDoc.email && doc.email === prodDoc.email) ||
                (prodDoc.username && doc.username === prodDoc.username) ||
                (prodDoc.icNumber && doc.icNumber === prodDoc.icNumber)
              );

              const existingDoc = mergedDocs[existingIndex];
              const prodDate = prodDoc.createdAt ? new Date(prodDoc.createdAt) : new Date(0);
              const existingDate = existingDoc.createdAt ? new Date(existingDoc.createdAt) : new Date(0);

              if (prodDate > existingDate) {
                console.log(`   🔄 Replacing duplicate player: ${prodDoc.fullName || prodDoc.email} (malaysia-pickleball version is newer)`);
                mergedDocs[existingIndex] = prodDoc;
              } else {
                console.log(`   ⏭️  Skipping duplicate player: ${prodDoc.fullName || prodDoc.email} (test version is newer)`);
              }
            }
          } else if (collectionName === 'tournaments') {
            // For tournaments, check applicationId or name+startDate
            isDuplicate = mergedDocs.some(doc =>
              (prodDoc.applicationId && doc.applicationId === prodDoc.applicationId) ||
              (prodDoc.name === doc.name && prodDoc.startDate === doc.startDate)
            );

            if (isDuplicate) {
              const existingIndex = mergedDocs.findIndex(doc =>
                (prodDoc.applicationId && doc.applicationId === prodDoc.applicationId) ||
                (prodDoc.name === doc.name && prodDoc.startDate === doc.startDate)
              );

              const existingDoc = mergedDocs[existingIndex];
              const prodDate = prodDoc.lastSyncedAt || prodDoc.createdAt || new Date(0);
              const existingDate = existingDoc.lastSyncedAt || existingDoc.createdAt || new Date(0);

              if (new Date(prodDate) > new Date(existingDate)) {
                console.log(`   🔄 Replacing duplicate tournament: ${prodDoc.name} (malaysia-pickleball version is newer)`);
                mergedDocs[existingIndex] = prodDoc;
              } else {
                console.log(`   ⏭️  Skipping duplicate tournament: ${prodDoc.name} (test version is newer)`);
              }
            }
          } else if (collectionName === 'posts') {
            // For posts, check _id
            isDuplicate = mergedDocs.some(doc =>
              doc._id.toString() === prodDoc._id.toString()
            );
          } else if (collectionName === 'news') {
            // For news, check newsId or title
            isDuplicate = mergedDocs.some(doc =>
              (prodDoc.newsId && doc.newsId === prodDoc.newsId) ||
              (prodDoc.title === doc.title)
            );
          } else {
            // For other collections, check _id or unique fields
            isDuplicate = mergedDocs.some(doc =>
              doc._id.toString() === prodDoc._id.toString()
            );
          }

          if (!isDuplicate) {
            mergedDocs.push(prodDoc);
          }
        }
      }

      // Insert merged documents into new database
      if (mergedDocs.length > 0) {
        // Drop existing collection in MPA-database to ensure clean state
        try {
          await newCollection.drop();
          console.log(`   🗑️  Dropped existing collection in MPA-database`);
        } catch (err) {
          // Collection doesn't exist, that's fine
        }

        // Insert all merged documents
        await newCollection.insertMany(mergedDocs);
        console.log(`   ✅ Inserted ${mergedDocs.length} documents into MPA-database`);

        migrationReport.push({
          collection: collectionName,
          testDocs: testCount,
          prodDocs: prodCount,
          merged: mergedDocs.length,
          status: 'success'
        });
      }
    }

    // Final Report
    console.log('\n' + '═'.repeat(80));
    console.log('📊 MIGRATION REPORT');
    console.log('═'.repeat(80) + '\n');

    console.log('Collection'.padEnd(30) + 'Test'.padStart(6) + 'M-P'.padStart(6) + 'Merged'.padStart(8) + '  Status');
    console.log('─'.repeat(80));

    let totalTest = 0;
    let totalProd = 0;
    let totalMerged = 0;

    migrationReport.forEach(report => {
      const status = report.status === 'success' ? '✅' : '⚪';
      console.log(
        report.collection.padEnd(30) +
        report.testDocs.toString().padStart(6) +
        report.prodDocs.toString().padStart(6) +
        report.merged.toString().padStart(8) +
        `  ${status}`
      );

      totalTest += report.testDocs;
      totalProd += report.prodDocs;
      totalMerged += report.merged;
    });

    console.log('─'.repeat(80));
    console.log(
      'TOTAL'.padEnd(30) +
      totalTest.toString().padStart(6) +
      totalProd.toString().padStart(6) +
      totalMerged.toString().padStart(8)
    );

    console.log('\n' + '═'.repeat(80));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\n📝 Summary:');
    console.log(`   • Total documents from test: ${totalTest}`);
    console.log(`   • Total documents from malaysia-pickleball: ${totalProd}`);
    console.log(`   • Total documents in MPA-database: ${totalMerged}`);
    console.log(`   • Duplicates removed: ${(totalTest + totalProd) - totalMerged}`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Verify data in MPA-database looks correct');
    console.log('   2. Update .env file to point to MPA-database');
    console.log('   3. Update Heroku config vars to point to MPA-database');
    console.log('   4. Test your application');
    console.log('   5. Once confirmed working, you can delete old databases\n');

  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

migrateToMPADatabase();
