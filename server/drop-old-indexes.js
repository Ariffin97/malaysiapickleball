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

// Get base MongoDB URI and replace database name with portal-dev
const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';
const PORTAL_DEV_URI = baseUri.replace(/\/[^\/]+$/, '/malaysia-pickleball-portal-dev');

async function dropAllOldIndexes() {
  try {
    console.log('🔧 Connecting to portal-dev database...');
    await mongoose.connect(PORTAL_DEV_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const playersCollection = db.collection('players');

    // Get all indexes
    console.log(`\n📋 Current indexes:`);
    const indexes = await playersCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // List of old indexes to drop (all with personalInfo prefix)
    const oldIndexes = [
      'personalInfo.email_1',
      'personalInfo.icNumber_1',
      'personalInfo.phoneNumber_1',
      'personalInfo.addressLine1_1',
      'personalInfo.city_1',
      'personalInfo.state_1'
    ];

    console.log(`\n🔧 Dropping old personalInfo.* indexes...`);

    for (const indexName of oldIndexes) {
      const indexExists = indexes.find(idx => idx.name === indexName);

      if (indexExists) {
        try {
          await playersCollection.dropIndex(indexName);
          console.log(`✅ Dropped: ${indexName}`);
        } catch (error) {
          console.error(`❌ Failed to drop ${indexName}:`, error.message);
        }
      } else {
        console.log(`⏭️  Skipped: ${indexName} (doesn't exist)`);
      }
    }

    // Show remaining indexes
    console.log(`\n📋 Remaining indexes:`);
    const remainingIndexes = await playersCollection.indexes();
    remainingIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log(`\n✅ All old indexes dropped successfully!`);
    console.log(`   You can now register new players without any errors.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

dropAllOldIndexes();
