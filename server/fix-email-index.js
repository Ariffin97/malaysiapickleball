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

async function fixEmailIndex() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const playersCollection = db.collection('players');

    // Get all indexes
    console.log('\n📋 Current indexes on players collection:');
    const indexes = await playersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if the old personalInfo.email index exists
    const oldIndexExists = indexes.some(index => index.name === 'personalInfo.email_1');

    if (oldIndexExists) {
      console.log('\n🗑️  Dropping old index: personalInfo.email_1');
      await playersCollection.dropIndex('personalInfo.email_1');
      console.log('✅ Old index dropped successfully');
    } else {
      console.log('\n✓ No old personalInfo.email_1 index found');
    }

    // Show indexes after cleanup
    console.log('\n📋 Indexes after cleanup:');
    const updatedIndexes = await playersCollection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index fix completed successfully!');
    console.log('You can now register new players without the duplicate key error.');

  } catch (error) {
    console.error('❌ Error fixing index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixEmailIndex();
