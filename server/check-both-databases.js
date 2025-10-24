import mongoose from 'mongoose';

async function checkDatabase(dbUri, dbName) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔌 Checking: ${dbName}`);
    console.log(`📍 URI: ${dbUri}`);
    console.log('='.repeat(60));

    await mongoose.connect(dbUri);
    console.log('✅ Connected');

    const db = mongoose.connection.db;

    // Check if unregisteredplayers collection exists
    const collections = await db.listCollections({ name: 'unregisteredplayers' }).toArray();

    if (collections.length > 0) {
      const collection = db.collection('unregisteredplayers');
      const count = await collection.countDocuments();
      console.log(`✅ Collection 'unregisteredplayers' EXISTS`);
      console.log(`📊 Total documents: ${count}`);

      if (count > 0) {
        console.log('\n📄 Sample documents:');
        const samples = await collection.find({}).limit(2).toArray();
        samples.forEach((doc, index) => {
          console.log(`\n   [${index + 1}]`);
          console.log('   ', JSON.stringify(doc, null, 2).replace(/\n/g, '\n   '));
        });
      }
    } else {
      console.log('❌ Collection "unregisteredplayers" NOT FOUND');
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

async function main() {
  console.log('\n🔍 CHECKING BOTH DATABASES FOR UNREGISTERED PLAYERS\n');

  // Check Portal DB
  await checkDatabase(
    'mongodb://localhost:27017/malaysia-pickleball-portal-dev',
    'Portal Database (malaysia-pickleball-portal-dev)'
  );

  // Check React App DB
  await checkDatabase(
    'mongodb://localhost:27017/MPA-database',
    'React App Database (MPA-database)'
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ Database check complete');
  console.log('='.repeat(60) + '\n');
}

main();
