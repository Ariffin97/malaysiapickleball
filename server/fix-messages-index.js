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

async function fixMessagesIndex() {
  try {
    console.log('🔧 Connecting to portal-dev database...');
    await mongoose.connect(PORTAL_DEV_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const messagesCollection = db.collection('messages');

    // Check if messages collection exists
    const collections = await db.listCollections({ name: 'messages' }).toArray();
    if (collections.length === 0) {
      console.log('\n❌ No "messages" collection found in this database.');
      return;
    }

    // Get message count
    const messageCount = await messagesCollection.countDocuments();
    console.log(`\n📊 Total messages: ${messageCount}`);

    // Get all indexes
    console.log(`\n📋 Current indexes on messages collection:`);
    const indexes = await messagesCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    // Check for the problematic messageId index
    const messageIdIndex = indexes.find(idx => idx.name === 'messageId_1');
    if (messageIdIndex) {
      console.log(`\n⚠️  FOUND THE PROBLEM: messageId_1 index exists!`);
      console.log(`   This is causing your registration to fail when creating welcome message.`);
      console.log(`\n🔧 Dropping the messageId_1 index...`);

      try {
        await messagesCollection.dropIndex('messageId_1');
        console.log(`✅ Successfully dropped messageId_1 index!`);
      } catch (dropError) {
        console.error(`❌ Failed to drop index:`, dropError.message);
      }
    } else {
      console.log(`\n✅ No messageId_1 index found.`);
    }

    // Show remaining indexes
    console.log(`\n📋 Remaining indexes on messages collection:`);
    const remainingIndexes = await messagesCollection.indexes();
    remainingIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    // Check for messages with null messageId
    const nullMessageIdCount = await messagesCollection.countDocuments({
      $or: [
        { messageId: null },
        { messageId: { $exists: false } }
      ]
    });

    console.log(`\n📊 Messages without messageId: ${nullMessageIdCount} (this is normal for the current schema)`);

    console.log(`\n✅ Messages collection fix completed!`);
    console.log(`   Player registration should now work correctly.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixMessagesIndex();
