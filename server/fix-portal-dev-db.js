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

async function fixPortalDevDB() {
  try {
    console.log('🔧 Connecting to portal-dev database...');
    console.log(`📍 Connection URI: ${PORTAL_DEV_URI.replace(/\/\/.*:.*@/, '//***:***@')}`);
    await mongoose.connect(PORTAL_DEV_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    console.log(`\n📊 Database name: ${db.databaseName}`);

    // Check if players collection exists
    const collections = await db.listCollections({ name: 'players' }).toArray();
    if (collections.length === 0) {
      console.log('\n❌ No "players" collection found in this database.');
      console.log('   This might not be the right database.');
      return;
    }

    const playersCollection = db.collection('players');
    const playerCount = await playersCollection.countDocuments();
    console.log(`\n📊 Total players: ${playerCount}`);

    // Get all indexes
    console.log(`\n📋 Current indexes:`);
    const indexes = await playersCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check for the problematic old index
    const oldIndex = indexes.find(idx => idx.name === 'personalInfo.email_1');
    if (oldIndex) {
      console.log(`\n⚠️  FOUND THE PROBLEM: personalInfo.email_1 index exists!`);
      console.log(`   This is causing your duplicate key error.`);
      console.log(`\n🔧 Dropping the old index...`);

      try {
        await playersCollection.dropIndex('personalInfo.email_1');
        console.log(`✅ Successfully dropped personalInfo.email_1 index!`);
      } catch (dropError) {
        console.error(`❌ Failed to drop index:`, dropError.message);
      }
    } else {
      console.log(`\n✅ No personalInfo.email_1 index found.`);
    }

    // Check for players with old schema structure
    const oldStructurePlayers = await playersCollection.find({
      'personalInfo.email': { $exists: true }
    }).toArray();

    if (oldStructurePlayers.length > 0) {
      console.log(`\n⚠️  Found ${oldStructurePlayers.length} players with old schema structure!`);
      console.log(`\n🔧 Migrating to new schema...`);

      for (const player of oldStructurePlayers) {
        try {
          const updateData = {
            email: player.personalInfo?.email || `temp-${player._id}@mpa.my`,
            phoneNumber: player.personalInfo?.phoneNumber || player.phoneNumber,
            addressLine1: player.personalInfo?.addressLine1 || player.addressLine1,
            addressLine2: player.personalInfo?.addressLine2 || player.addressLine2,
            city: player.personalInfo?.city || player.city,
            state: player.personalInfo?.state || player.state
          };

          await playersCollection.updateOne(
            { _id: player._id },
            {
              $set: updateData,
              $unset: { personalInfo: '' } // Remove old nested structure
            }
          );

          console.log(`✅ Migrated: ${player.fullName || player._id}`);
        } catch (error) {
          console.error(`❌ Failed to migrate ${player._id}:`, error.message);
        }
      }
    }

    // Check for null emails
    const nullEmailCount = await playersCollection.countDocuments({
      $or: [
        { email: null },
        { email: { $exists: false } },
        { email: '' }
      ]
    });

    if (nullEmailCount > 0) {
      console.log(`\n⚠️  Found ${nullEmailCount} players with null/missing email`);
      const nullEmailPlayers = await playersCollection.find({
        $or: [
          { email: null },
          { email: { $exists: false } },
          { email: '' }
        ]
      }).toArray();

      console.log(`\n🔧 Fixing null emails...`);
      for (const player of nullEmailPlayers) {
        const tempEmail = `temp-${player._id}@mpa.my`;
        await playersCollection.updateOne(
          { _id: player._id },
          { $set: { email: tempEmail } }
        );
        console.log(`✅ Fixed: ${player.fullName || player._id} → ${tempEmail}`);
      }
    }

    console.log(`\n✅ Portal-dev database fix completed!`);
    console.log(`   You should now be able to register new players.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixPortalDevDB();
