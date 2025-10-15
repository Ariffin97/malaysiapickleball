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

async function checkPlayers() {
  try {
    console.log('🔧 Connecting to portal-dev database...');
    await mongoose.connect(PORTAL_DEV_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const playersCollection = db.collection('players');

    // Get total count
    const playerCount = await playersCollection.countDocuments();
    console.log(`\n📊 Total players in database: ${playerCount}`);

    if (playerCount === 0) {
      console.log('\n✅ Database is empty - no players registered yet!');
      console.log('   The "username already taken" error might be caused by something else.');
      return;
    }

    // Get all players
    console.log(`\n👥 All players in database:\n`);
    const players = await playersCollection.find({}).toArray();

    players.forEach((player, index) => {
      console.log(`${index + 1}. Player: ${player.fullName || 'N/A'}`);
      console.log(`   Player ID: ${player.playerId || 'N/A'}`);
      console.log(`   Username: "${player.username || 'N/A'}"`);
      console.log(`   Email: ${player.email || 'N/A'}`);
      console.log(`   IC Number: ${player.icNumber || 'N/A'}`);
      console.log(`   Status: ${player.status || 'N/A'}`);
      console.log(`   Created: ${player.createdAt ? new Date(player.createdAt).toLocaleString() : 'N/A'}`);
      console.log('');
    });

    // Check for duplicate usernames
    console.log(`\n🔍 Checking for duplicate usernames...`);
    const usernameGroups = await playersCollection.aggregate([
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 },
          players: { $push: { fullName: '$fullName', playerId: '$playerId', _id: '$_id' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (usernameGroups.length > 0) {
      console.log(`⚠️  Found ${usernameGroups.length} duplicate username(s):`);
      usernameGroups.forEach(group => {
        console.log(`\n   Username: "${group._id}"`);
        console.log(`   Used by ${group.count} players:`);
        group.players.forEach(p => {
          console.log(`     - ${p.fullName} (${p.playerId || p._id})`);
        });
      });
    } else {
      console.log(`✅ No duplicate usernames found`);
    }

    // Check for usernames with whitespace or special characters
    console.log(`\n🔍 Checking for usernames with unusual characters...`);
    const playersWithIssues = players.filter(p => {
      if (!p.username) return false;
      return p.username !== p.username.trim() ||
             /\s/.test(p.username) ||
             p.username.length === 0;
    });

    if (playersWithIssues.length > 0) {
      console.log(`⚠️  Found ${playersWithIssues.length} username(s) with issues:`);
      playersWithIssues.forEach(p => {
        console.log(`   - "${p.username}" (length: ${p.username.length}, has whitespace: ${/\s/.test(p.username)})`);
      });
    } else {
      console.log(`✅ All usernames look clean`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkPlayers();
