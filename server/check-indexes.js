import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if it exists (for local development), otherwise load .env (production)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📝 Loading .env.local (LOCAL DEVELOPMENT MODE)');
  dotenv.config({ path: envLocalPath, override: true });
} else {
  console.log('📝 Loading .env (PRODUCTION MODE)');
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';

async function checkIndexes() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    console.log(`📍 Connection URI: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}`); // Hide credentials
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    console.log(`\n📊 Database name: ${db.databaseName}`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in database (${collections.length}):`);
    collections.forEach((coll, index) => {
      console.log(`  ${index + 1}. ${coll.name}`);
    });

    // Check players collection specifically
    console.log(`\n🔍 Checking 'players' collection...`);
    const playersCollection = db.collection('players');

    // Count documents
    const playerCount = await playersCollection.countDocuments();
    console.log(`   Total players: ${playerCount}`);

    // Get all indexes
    console.log(`\n📋 Indexes on 'players' collection:`);
    const indexes = await playersCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`\n  ${i + 1}. Index: ${index.name}`);
      console.log(`     Keys: ${JSON.stringify(index.key)}`);
      console.log(`     Unique: ${index.unique || false}`);
      console.log(`     Sparse: ${index.sparse || false}`);
    });

    // Check specifically for personalInfo.email index
    const oldIndex = indexes.find(idx => idx.name === 'personalInfo.email_1');
    if (oldIndex) {
      console.log(`\n⚠️  FOUND OLD INDEX: personalInfo.email_1`);
      console.log(`   This is causing your duplicate key error!`);
      console.log(`\n🔧 Dropping old index...`);

      try {
        await playersCollection.dropIndex('personalInfo.email_1');
        console.log(`✅ Successfully dropped personalInfo.email_1 index!`);
        console.log(`   You should now be able to register new players.`);
      } catch (dropError) {
        console.error(`❌ Failed to drop index:`, dropError.message);
      }
    } else {
      console.log(`\n✅ No old personalInfo.email_1 index found`);
      console.log(`   Your indexes look good!`);
    }

    // Count players with null email
    const nullEmailCount = await playersCollection.countDocuments({
      $or: [
        { email: null },
        { email: { $exists: false } },
        { email: '' }
      ]
    });

    const oldStructureCount = await playersCollection.countDocuments({
      'personalInfo.email': { $exists: true }
    });

    console.log(`\n📊 Email Statistics:`);
    console.log(`   Players with null/missing email: ${nullEmailCount}`);
    console.log(`   Players with old structure (personalInfo.email): ${oldStructureCount}`);

    if (oldStructureCount > 0) {
      console.log(`\n⚠️  Found ${oldStructureCount} players with old schema structure!`);
      console.log(`   These need to be migrated to the new schema.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkIndexes();
