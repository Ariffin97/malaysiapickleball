const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';

async function migrateTournaments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all tournaments without a tier field
    const tournamentsWithoutTier = await Tournament.find({ 
      tier: { $exists: false } 
    });

    console.log(`Found ${tournamentsWithoutTier.length} tournaments without tier field`);

    if (tournamentsWithoutTier.length === 0) {
      console.log('No tournaments need migration');
      return;
    }

    // Update each tournament
    let updatedCount = 0;
    for (const tournament of tournamentsWithoutTier) {
      // Set tier to 5 (non-ranked) for all existing tournaments
      tournament.tier = 5;
      
      // Also set default values for new MPRS fields if they don't exist
      if (!tournament.status) {
        tournament.status = 'completed'; // Assume old tournaments are completed
      }
      if (tournament.finalized === undefined) {
        tournament.finalized = false;
      }
      if (!tournament.divisionsOffered) {
        tournament.divisionsOffered = [];
      }
      
      await tournament.save();
      updatedCount++;
      console.log(`Updated tournament: ${tournament.name} (ID: ${tournament._id})`);
    }

    console.log(`✅ Migration completed: ${updatedCount} tournaments updated with tier = 5 (non-ranked)`);

    // Verify the update
    const verifyCount = await Tournament.countDocuments({ tier: 5 });
    console.log(`Verification: ${verifyCount} tournaments now have tier = 5`);

    // Show tier distribution
    const tierDistribution = await Tournament.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('\nTier Distribution:');
    tierDistribution.forEach(tier => {
      const tierName = tier._id === 5 ? 'Non-ranked' : `Tier ${tier._id}`;
      console.log(`  ${tierName}: ${tier.count} tournaments`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
console.log('Starting tournament tier migration...');
console.log('This will add tier = 5 (non-ranked) to all existing tournaments');
console.log('----------------------------------------');
migrateTournaments();