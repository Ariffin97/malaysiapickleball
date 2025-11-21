const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';

// Tier mappings
const TIER_MAPPINGS = {
  'international': 1,
  'national': 2,
  'state': 3,
  'wmalaysia': 3,
  'sarawak': 3,
  'local': 4
};

const TIER_NAMES = {
  1: 'Tier 1 (International)',
  2: 'Tier 2 (National)',
  3: 'Tier 3 (State/Regional)',
  4: 'Tier 4 (Local)',
  5: 'Non-ranked'
};

async function setTournamentTier(tournamentId, tier) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      console.error(`❌ Tournament with ID ${tournamentId} not found`);
      return;
    }

    console.log(`Found tournament: ${tournament.name}`);
    console.log(`Current tier: ${tournament.tier} (${TIER_NAMES[tournament.tier]})`);
    console.log(`Setting tier to: ${tier} (${TIER_NAMES[tier]})`);

    // Update the tier
    tournament.tier = tier;
    await tournament.save();

    console.log(`✅ Successfully updated tournament tier to ${tier} (${TIER_NAMES[tier]})`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
}

async function autoSetTiers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all tournaments with tier 5 (non-ranked)
    const tournaments = await Tournament.find({ tier: 5 });
    console.log(`Found ${tournaments.length} non-ranked tournaments`);

    let updatedCount = 0;
    for (const tournament of tournaments) {
      const suggestedTier = TIER_MAPPINGS[tournament.type];
      if (suggestedTier) {
        console.log(`Setting ${tournament.name} (type: ${tournament.type}) to Tier ${suggestedTier}`);
        tournament.tier = suggestedTier;
        await tournament.save();
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} tournaments based on their type`);

    // Show final distribution
    const distribution = await Tournament.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          tournaments: { $push: '$name' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('\nFinal Tier Distribution:');
    distribution.forEach(tier => {
      console.log(`  ${TIER_NAMES[tier._id]}: ${tier.count} tournaments`);
      if (tier.tournaments.length <= 5) {
        tier.tournaments.forEach(name => console.log(`    - ${name}`));
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Tournament Tier Management Script');
  console.log('=================================');
  console.log('\nUsage:');
  console.log('  node setTournamentTier.js auto              - Auto-set tiers based on tournament type');
  console.log('  node setTournamentTier.js <id> <tier>       - Set specific tournament tier');
  console.log('\nTier Levels:');
  console.log('  1 - International tournaments');
  console.log('  2 - National tournaments');
  console.log('  3 - State/Regional tournaments');
  console.log('  4 - Local tournaments');
  console.log('  5 - Non-ranked tournaments');
  console.log('\nExamples:');
  console.log('  node setTournamentTier.js auto');
  console.log('  node setTournamentTier.js 65abc123def45678 2');
  process.exit(0);
}

if (args[0] === 'auto') {
  console.log('Auto-setting tournament tiers based on type...');
  autoSetTiers();
} else if (args.length === 2) {
  const [tournamentId, tier] = args;
  const tierNum = parseInt(tier);
  
  if (isNaN(tierNum) || tierNum < 1 || tierNum > 5) {
    console.error('❌ Invalid tier. Must be a number between 1 and 5');
    process.exit(1);
  }
  
  setTournamentTier(tournamentId, tierNum);
} else {
  console.error('❌ Invalid arguments. Run without arguments to see usage.');
  process.exit(1);
}