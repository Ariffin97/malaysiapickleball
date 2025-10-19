import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupDuplicates() {
  try {
    console.log('═'.repeat(80));
    console.log('🧹 CLEANUP DUPLICATE TOURNAMENTS');
    console.log('═'.repeat(80));
    console.log('');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MPA-database\n');

    const db = mongoose.connection.client.db('MPA-database');
    const tournamentsCollection = db.collection('tournaments');

    // Find all tournaments with status "upcoming" and no applicationId
    const duplicates = await tournamentsCollection.find({
      status: 'upcoming',
      $or: [
        { applicationId: { $exists: false } },
        { applicationId: null },
        { applicationId: 'N/A' },
        { applicationId: '' }
      ]
    }).toArray();

    console.log(`📊 Found ${duplicates.length} duplicate tournaments to remove:\n`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found! Database is clean.\n');
      return;
    }

    duplicates.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name || 'Unnamed'}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Start Date: ${t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Application ID: ${t.applicationId || 'NONE'}`);
      console.log(`   Database ID: ${t._id}`);
      console.log('');
    });

    console.log('─'.repeat(80));
    console.log('⚠️  WARNING: This will DELETE these tournaments permanently!');
    console.log('─'.repeat(80));
    console.log('');
    console.log('These are old manual entries that are duplicates of Portal-synced tournaments.');
    console.log('The Portal-synced versions (status: "Approved") will remain.\n');

    // Delete duplicates
    const result = await tournamentsCollection.deleteMany({
      status: 'upcoming',
      $or: [
        { applicationId: { $exists: false } },
        { applicationId: null },
        { applicationId: 'N/A' },
        { applicationId: '' }
      ]
    });

    console.log('═'.repeat(80));
    console.log('✅ CLEANUP COMPLETE');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`🗑️  Deleted ${result.deletedCount} duplicate tournaments`);
    console.log('');

    // Verify final count
    const remaining = await tournamentsCollection.countDocuments();
    const approved = await tournamentsCollection.countDocuments({ status: 'Approved' });

    console.log('📊 Final Tournament Count:');
    console.log(`   Total: ${remaining}`);
    console.log(`   Approved: ${approved}`);
    console.log('');

    if (remaining === approved) {
      console.log('✅ Perfect! All tournaments are now Portal-synced "Approved" tournaments.');
      console.log('   Your database now matches the MPA Portal.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

cleanupDuplicates();
