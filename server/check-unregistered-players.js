import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if it exists (for local development)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📝 Loading .env.local (LOCAL DEVELOPMENT MODE)');
  dotenv.config({ path: envLocalPath, override: true });
} else {
  console.log('📝 Loading .env');
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';

async function checkUnregisteredPlayers() {
  try {
    console.log('🔌 Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => console.log('  -', col.name));
    console.log();

    // Check for unregistered players collection
    const unregisteredCollectionNames = collections
      .map(col => col.name)
      .filter(name => name.toLowerCase().includes('unregistered'));

    if (unregisteredCollectionNames.length > 0) {
      console.log('🔍 Found collections with "unregistered":', unregisteredCollectionNames.join(', '));

      for (const collectionName of unregisteredCollectionNames) {
        console.log(`\n📊 Checking collection: ${collectionName}`);
        const collection = db.collection(collectionName);

        const count = await collection.countDocuments();
        console.log(`   Total documents: ${count}`);

        if (count > 0) {
          console.log('\n   Sample documents:');
          const samples = await collection.find({}).limit(3).toArray();
          samples.forEach((doc, index) => {
            console.log(`\n   Document ${index + 1}:`);
            console.log('   ', JSON.stringify(doc, null, 2).split('\n').join('\n   '));
          });
        }
      }
    } else {
      console.log('❌ No collections found with "unregistered" in the name');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUnregisteredPlayers();
