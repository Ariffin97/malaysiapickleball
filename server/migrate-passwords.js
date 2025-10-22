import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if it exists (for local development), otherwise load .env (production)
// Look in the parent directory (project root) not the server directory
const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('📝 Loading .env.local (LOCAL DEVELOPMENT MODE)');
  console.log(`   Path: ${envLocalPath}`);
  dotenv.config({ path: envLocalPath, override: true });
} else if (fs.existsSync(envPath)) {
  console.log('📝 Loading .env (PRODUCTION MODE)');
  console.log(`   Path: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('⚠️  No .env file found, using defaults');
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
  strict: false
});

const Player = mongoose.model('Player', playerSchema);

// Function to check if a password is already bcrypt hashed
function isPasswordHashed(password) {
  if (!password) return false;
  // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are typically 60 characters long
  return /^\$2[aby]\$\d{2}\$/.test(password);
}

async function migratePasswords() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all players
    console.log('\n🔍 Fetching all players...');
    const allPlayers = await Player.find({});
    console.log(`📊 Found ${allPlayers.length} total players in database`);

    // Separate players into hashed and plaintext passwords
    const plaintextPlayers = [];
    const hashedPlayers = [];

    for (const player of allPlayers) {
      if (!player.password) {
        console.log(`⚠️  Warning: Player ${player.fullName} (${player.playerId}) has no password`);
        continue;
      }

      if (isPasswordHashed(player.password)) {
        hashedPlayers.push(player);
      } else {
        plaintextPlayers.push(player);
      }
    }

    console.log(`\n📈 Password Status:`);
    console.log(`   ✅ Already hashed: ${hashedPlayers.length} players`);
    console.log(`   🔓 Plaintext (needs hashing): ${plaintextPlayers.length} players`);

    if (plaintextPlayers.length === 0) {
      console.log('\n✅ All passwords are already hashed! No migration needed.');
    } else {
      console.log(`\n🔐 Starting password migration for ${plaintextPlayers.length} players...`);
      console.log('━'.repeat(60));

      let successCount = 0;
      let errorCount = 0;
      const saltRounds = 10;

      for (let i = 0; i < plaintextPlayers.length; i++) {
        const player = plaintextPlayers[i];
        const playerNum = i + 1;

        try {
          // Hash the plaintext password
          const hashedPassword = await bcrypt.hash(player.password, saltRounds);

          // Update the player's password
          await Player.updateOne(
            { _id: player._id },
            { $set: { password: hashedPassword } }
          );

          console.log(`✅ [${playerNum}/${plaintextPlayers.length}] ${player.fullName} (${player.username})`);
          successCount++;
        } catch (error) {
          console.error(`❌ [${playerNum}/${plaintextPlayers.length}] Failed for ${player.fullName}:`, error.message);
          errorCount++;
        }
      }

      console.log('━'.repeat(60));
      console.log(`\n📊 Migration Summary:`);
      console.log(`   ✅ Successfully hashed: ${successCount} passwords`);
      if (errorCount > 0) {
        console.log(`   ❌ Failed: ${errorCount} passwords`);
      }
      console.log(`   📝 Already hashed (skipped): ${hashedPlayers.length} passwords`);
      console.log(`   📈 Total players: ${allPlayers.length}`);

      console.log('\n🎉 Password migration completed!');
      console.log('All players can now login with their original passwords.');
    }

  } catch (error) {
    console.error('❌ Error during password migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
console.log('🔐 PASSWORD MIGRATION SCRIPT');
console.log('━'.repeat(60));
console.log('This script will hash all plaintext passwords in the database.');
console.log('Passwords already hashed will be skipped.');
console.log('━'.repeat(60));
console.log('');

migratePasswords();
