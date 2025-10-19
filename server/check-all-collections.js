import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkAllCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const databases = ['test', 'malaysia-pickleball'];

    for (const dbName of databases) {
      console.log('═'.repeat(80));
      console.log(`DATABASE: ${dbName}`);
      console.log('═'.repeat(80));

      const db = mongoose.connection.client.db(dbName);
      const collections = await db.listCollections().toArray();

      if (collections.length === 0) {
        console.log('❌ No collections found\n');
        continue;
      }

      console.log(`Found ${collections.length} collection(s)\n`);

      // Important collections to check
      const importantCollections = [
        'players',
        'tournaments',
        'news',
        'milestones',
        'posts',
        'messages',
        'courses',
        'clinics',
        'admins',
        'featuredvideos',
        'announcements',
        'venues'
      ];

      for (const collectionName of importantCollections) {
        const exists = collections.find(c => c.name === collectionName);
        if (!exists) continue;

        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        // Get most recent document
        const newest = await collection.find({})
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        const newestDate = newest[0]?.createdAt
          ? new Date(newest[0].createdAt).toLocaleString()
          : 'No date';

        const emoji = count > 0 ? '✅' : '⚪';
        console.log(`${emoji} ${collectionName.padEnd(25)} ${String(count).padStart(5)} documents | Latest: ${newestDate}`);
      }

      console.log('\n');
    }

    // Summary
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));

    const testDb = mongoose.connection.client.db('test');
    const prodDb = mongoose.connection.client.db('malaysia-pickleball');

    const testPlayers = await testDb.collection('players').countDocuments();
    const prodPlayers = await prodDb.collection('players').countDocuments();

    const testTournaments = await testDb.collection('tournaments').countDocuments();
    const prodTournaments = await prodDb.collection('tournaments').countDocuments();

    const testNews = await testDb.collection('news').countDocuments();
    const prodNews = await prodDb.collection('news').countDocuments();

    const testPosts = (await testDb.listCollections({ name: 'posts' }).toArray()).length > 0
      ? await testDb.collection('posts').countDocuments()
      : 0;
    const prodPosts = (await prodDb.listCollections({ name: 'posts' }).toArray()).length > 0
      ? await prodDb.collection('posts').countDocuments()
      : 0;

    console.log('\n🎯 Data Distribution:\n');
    console.log(`Players:     test=${testPlayers.toString().padStart(4)}  |  malaysia-pickleball=${prodPlayers.toString().padStart(4)}`);
    console.log(`Tournaments: test=${testTournaments.toString().padStart(4)}  |  malaysia-pickleball=${prodTournaments.toString().padStart(4)}`);
    console.log(`News:        test=${testNews.toString().padStart(4)}  |  malaysia-pickleball=${prodNews.toString().padStart(4)}`);
    console.log(`Posts:       test=${testPosts.toString().padStart(4)}  |  malaysia-pickleball=${prodPosts.toString().padStart(4)}`);

    console.log('\n💡 Conclusion:\n');
    if (testPlayers > prodPlayers && testTournaments > prodTournaments) {
      console.log('⚠️  Your PRODUCTION data is in the "test" database!');
      console.log('   All Heroku users are writing to "test" instead of "malaysia-pickleball"');
    } else if (prodPlayers > testPlayers) {
      console.log('✅ Your PRODUCTION data is in the "malaysia-pickleball" database');
    } else {
      console.log('⚠️  Data is split between both databases - needs consolidation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAllCollections();
