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

// Player Schema
const playerSchema = new mongoose.Schema({
  playerId: String,
  fullName: String,
  profilePicture: String,
  gender: String,
  icNumber: String,
  age: Number,
  email: String,
  phoneNumber: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  username: String,
  password: String,
  termsAccepted: Boolean,
  status: String,
  duprRating: Number,
  duprId: String
}, {
  timestamps: true,
  strict: false // Allow fields that might not be in schema
});

const Player = mongoose.model('Player', playerSchema);

async function fixNullEmails() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all players with null or missing email
    console.log('\n🔍 Searching for players with null or missing email...');
    const playersWithoutEmail = await Player.find({
      $or: [
        { email: null },
        { email: { $exists: false } },
        { email: '' }
      ]
    });

    console.log(`\n📊 Found ${playersWithoutEmail.length} players with null/missing email:`);

    if (playersWithoutEmail.length === 0) {
      console.log('✅ No players with null email found. Your database is clean!');
    } else {
      playersWithoutEmail.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.fullName} (${player.playerId || player._id})`);
        console.log(`     Username: ${player.username || 'N/A'}`);
        console.log(`     Email: ${player.email || 'NULL'}`);
        console.log(`     IC: ${player.icNumber || 'N/A'}`);
        console.log('');
      });

      console.log('\n🔧 Fixing players with null email...');
      console.log('Strategy: Generate temporary email addresses based on playerId');

      let fixed = 0;
      for (const player of playersWithoutEmail) {
        const tempEmail = `player-${player.playerId || player._id}@temp.mpa.my`;

        try {
          await Player.updateOne(
            { _id: player._id },
            { $set: { email: tempEmail } }
          );
          console.log(`✅ Fixed: ${player.fullName} → ${tempEmail}`);
          fixed++;
        } catch (error) {
          console.error(`❌ Failed to fix ${player.fullName}:`, error.message);
        }
      }

      console.log(`\n✅ Successfully fixed ${fixed} out of ${playersWithoutEmail.length} players`);
      console.log('\n⚠️  NOTE: These players have temporary email addresses.');
      console.log('   They should update their email when they next login.');
    }

    console.log('\n✅ Email fix completed!');
    console.log('You can now register new players without the duplicate key error.');

  } catch (error) {
    console.error('❌ Error fixing null emails:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixNullEmails();
