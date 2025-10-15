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

// YOU NEED TO UPDATE THIS WITH YOUR PRODUCTION DATABASE URI
const PRODUCTION_URI = process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI;

async function fixProductionDB() {
  try {
    console.log('⚠️  WARNING: This script will modify your PRODUCTION database!');
    console.log('🔧 Connecting to production database...');
    console.log(`📍 URI: ${PRODUCTION_URI.replace(/\/\/.*:.*@/, '//***:***@').replace(/\/[^\/]+$/, '/***')}`);

    // Add a 5 second delay for safety
    console.log('\n⏳ Starting in 5 seconds... Press Ctrl+C to cancel!\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    await mongoose.connect(PRODUCTION_URI);
    console.log('✅ Connected to production database');

    const db = mongoose.connection.db;
    console.log(`\n📊 Database: ${db.databaseName}`);

    // Fix Players Collection
    console.log('\n🔧 Fixing PLAYERS collection...');
    const playersCollection = db.collection('players');

    const playerIndexes = await playersCollection.indexes();
    console.log(`\n📋 Current player indexes:`);
    playerIndexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop old player indexes
    const oldPlayerIndexes = ['personalInfo.email_1', 'personalInfo.icNumber_1'];
    for (const indexName of oldPlayerIndexes) {
      const exists = playerIndexes.find(idx => idx.name === indexName);
      if (exists) {
        try {
          await playersCollection.dropIndex(indexName);
          console.log(`✅ Dropped player index: ${indexName}`);
        } catch (error) {
          console.log(`⚠️  Could not drop ${indexName}: ${error.message}`);
        }
      } else {
        console.log(`✅ Player index ${indexName} already removed or doesn't exist`);
      }
    }

    // Fix Messages Collection
    console.log('\n🔧 Fixing MESSAGES collection...');
    const messagesCollection = db.collection('messages');

    const messageIndexes = await messagesCollection.indexes();
    console.log(`\n📋 Current message indexes:`);
    messageIndexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop old message index
    const messageIdIndex = messageIndexes.find(idx => idx.name === 'messageId_1');
    if (messageIdIndex) {
      try {
        await messagesCollection.dropIndex('messageId_1');
        console.log(`✅ Dropped message index: messageId_1`);
      } catch (error) {
        console.log(`⚠️  Could not drop messageId_1: ${error.message}`);
      }
    } else {
      console.log(`✅ Message index messageId_1 already removed or doesn't exist`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL INDEX SUMMARY');
    console.log('='.repeat(60));

    console.log('\n👥 Players Collection:');
    const finalPlayerIndexes = await playersCollection.indexes();
    finalPlayerIndexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n💬 Messages Collection:');
    const finalMessageIndexes = await messagesCollection.indexes();
    finalMessageIndexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Production database is now ready for safe registrations!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('\n⚠️  IMPORTANT: Production database may still have issues!');
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
    process.exit(0);
  }
}

fixProductionDB();
