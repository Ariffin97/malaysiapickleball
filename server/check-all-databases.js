import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load production .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('📝 Loading .env file');
  dotenv.config({ path: envPath });
} else {
  console.log('❌ .env file not found');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

// Extract base URI without database name
const baseUri = MONGODB_URI.replace(/\/[^\/\?]+(\?|$)/, '/$1');

async function checkAllDatabases() {
  try {
    console.log('🔧 Connecting to MongoDB Atlas...');
    console.log(`📍 Connection: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}\n`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const adminDb = mongoose.connection.db.admin();

    // List all databases
    console.log('📚 Fetching all databases...\n');
    const { databases } = await adminDb.listDatabases();

    console.log(`Found ${databases.length} database(s):\n`);
    databases.forEach((db, index) => {
      const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
      console.log(`${index + 1}. ${db.name} (${sizeMB} MB)`);
    });
    console.log('\n' + '='.repeat(80) + '\n');

    // Check each database for player collections
    const playerData = [];

    for (const database of databases) {
      const dbName = database.name;

      // Skip system databases
      if (dbName === 'admin' || dbName === 'local' || dbName === 'config') {
        continue;
      }

      console.log(`\n📊 Checking database: ${dbName}`);
      console.log('-'.repeat(80));

      const db = mongoose.connection.client.db(dbName);
      const collections = await db.listCollections().toArray();

      console.log(`   Collections: ${collections.map(c => c.name).join(', ') || 'None'}`);

      // Look for player collections (case-insensitive)
      const playerCollectionNames = collections
        .filter(c => c.name.toLowerCase().includes('player'))
        .map(c => c.name);

      if (playerCollectionNames.length === 0) {
        console.log(`   ❌ No player collections found`);
        continue;
      }

      // Check each player collection
      for (const collectionName of playerCollectionNames) {
        console.log(`\n   📁 Collection: ${collectionName}`);

        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        console.log(`   👥 Total players: ${count}`);

        if (count === 0) {
          console.log(`   ⚠️  Empty collection`);
          playerData.push({
            database: dbName,
            collection: collectionName,
            count: 0,
            isEmpty: true
          });
          continue;
        }

        // Get most recent player
        const newestPlayer = await collection.find({})
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        // Get oldest player
        const oldestPlayer = await collection.find({})
          .sort({ createdAt: 1 })
          .limit(1)
          .toArray();

        // Get sample players
        const samplePlayers = await collection.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();

        // Check for unique fields
        const uniqueUsernames = await collection.distinct('username');
        const uniqueEmails = await collection.distinct('email');
        const uniquePlayerIds = await collection.distinct('playerId');

        console.log(`   📅 Date range:`);
        if (oldestPlayer[0]?.createdAt) {
          console.log(`      Oldest: ${new Date(oldestPlayer[0].createdAt).toLocaleString()}`);
        } else {
          console.log(`      Oldest: No createdAt field`);
        }

        if (newestPlayer[0]?.createdAt) {
          console.log(`      Newest: ${new Date(newestPlayer[0].createdAt).toLocaleString()}`);
        } else {
          console.log(`      Newest: No createdAt field`);
        }

        console.log(`   🔑 Unique values:`);
        console.log(`      Usernames: ${uniqueUsernames.length}`);
        console.log(`      Emails: ${uniqueEmails.length}`);
        console.log(`      Player IDs: ${uniquePlayerIds.length}`);

        // Check data quality
        const playersWithoutEmail = await collection.countDocuments({ email: { $in: [null, ''] } });
        const playersWithoutUsername = await collection.countDocuments({ username: { $in: [null, ''] } });
        const playersWithoutPlayerId = await collection.countDocuments({ playerId: { $in: [null, ''] } });

        console.log(`   ⚠️  Data quality:`);
        console.log(`      Missing email: ${playersWithoutEmail}`);
        console.log(`      Missing username: ${playersWithoutUsername}`);
        console.log(`      Missing playerId: ${playersWithoutPlayerId}`);

        console.log(`\n   📋 Sample players (5 most recent):`);
        samplePlayers.forEach((player, index) => {
          console.log(`      ${index + 1}. ${player.fullName || 'N/A'}`);
          console.log(`         Player ID: ${player.playerId || 'N/A'}`);
          console.log(`         Username: ${player.username || 'N/A'}`);
          console.log(`         Email: ${player.email || 'N/A'}`);
          console.log(`         Created: ${player.createdAt ? new Date(player.createdAt).toLocaleString() : 'N/A'}`);
        });

        // Store data for comparison
        playerData.push({
          database: dbName,
          collection: collectionName,
          count,
          newestDate: newestPlayer[0]?.createdAt,
          oldestDate: oldestPlayer[0]?.createdAt,
          uniqueUsernames: uniqueUsernames.length,
          uniqueEmails: uniqueEmails.length,
          uniquePlayerIds: uniquePlayerIds.length,
          missingEmail: playersWithoutEmail,
          missingUsername: playersWithoutUsername,
          missingPlayerId: playersWithoutPlayerId,
          samplePlayers: samplePlayers.slice(0, 3),
          isEmpty: false
        });
      }
    }

    // Summary comparison
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY & COMPARISON');
    console.log('='.repeat(80) + '\n');

    if (playerData.length === 0) {
      console.log('❌ No player data found in any database!');
      return;
    }

    // Sort by count and recency
    const sortedByCount = [...playerData].sort((a, b) => b.count - a.count);
    const sortedByRecency = [...playerData]
      .filter(d => d.newestDate)
      .sort((a, b) => new Date(b.newestDate) - new Date(a.newestDate));

    console.log('🔢 By Player Count:');
    sortedByCount.forEach((data, index) => {
      const badge = index === 0 ? '👑' : '  ';
      console.log(`${badge} ${index + 1}. ${data.database}.${data.collection}: ${data.count} players`);
    });

    console.log('\n📅 By Most Recent Activity:');
    sortedByRecency.forEach((data, index) => {
      const badge = index === 0 ? '👑' : '  ';
      const date = data.newestDate ? new Date(data.newestDate).toLocaleString() : 'N/A';
      console.log(`${badge} ${index + 1}. ${data.database}.${data.collection}: ${date}`);
    });

    console.log('\n🎯 Data Quality Score:');
    playerData.forEach((data) => {
      if (data.isEmpty) return;

      const completeness = (
        (data.count - data.missingEmail) / data.count * 0.33 +
        (data.count - data.missingUsername) / data.count * 0.33 +
        (data.count - data.missingPlayerId) / data.count * 0.34
      ) * 100;

      const uniqueness = (
        (data.uniqueEmails / data.count) * 0.33 +
        (data.uniqueUsernames / data.count) * 0.33 +
        (data.uniquePlayerIds / data.count) * 0.34
      ) * 100;

      const quality = (completeness + uniqueness) / 2;

      console.log(`   ${data.database}.${data.collection}: ${quality.toFixed(1)}% quality`);
      console.log(`      Completeness: ${completeness.toFixed(1)}%`);
      console.log(`      Uniqueness: ${uniqueness.toFixed(1)}%`);
    });

    // Recommendation
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATION');
    console.log('='.repeat(80) + '\n');

    const recommended = sortedByRecency[0];
    if (recommended && !recommended.isEmpty) {
      console.log(`✅ The database with the most recent and complete data appears to be:`);
      console.log(`\n   📍 Database: ${recommended.database}`);
      console.log(`   📁 Collection: ${recommended.collection}`);
      console.log(`   👥 Players: ${recommended.count}`);
      console.log(`   📅 Most recent: ${new Date(recommended.newestDate).toLocaleString()}`);
      console.log(`\n   This should likely be your PRODUCTION database.`);

      const others = playerData.filter(d =>
        d.database !== recommended.database || d.collection !== recommended.collection
      );

      if (others.length > 0) {
        console.log(`\n⚠️  Other databases/collections found:`);
        others.forEach(d => {
          console.log(`   - ${d.database}.${d.collection} (${d.count} players) - Can likely be deleted`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkAllDatabases();
