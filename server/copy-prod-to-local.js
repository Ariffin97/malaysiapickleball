import mongoose from 'mongoose';

// Production MongoDB Atlas
const PROD_URI = 'mongodb+srv://Ariffin:Ariffin.97@cluster0.gqtnjwk.mongodb.net/MPA-database?retryWrites=true&w=majority&appName=Cluster0';

// Local MongoDB
const LOCAL_URI = 'mongodb://localhost:27017/MPA-database';

async function copyProdToLocal() {
  try {
    console.log('═'.repeat(80));
    console.log('📋 COPY PRODUCTION DATA TO LOCAL');
    console.log('═'.repeat(80));
    console.log('');
    console.log('This will copy all data from production MPA-database to your local MongoDB.');
    console.log('');

    // Connect to production
    console.log('🌐 Connecting to Production (MongoDB Atlas)...');
    const prodConn = await mongoose.createConnection(PROD_URI).asPromise();
    console.log('✅ Connected to Production\n');

    // Connect to local
    console.log('💻 Connecting to Local MongoDB...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local\n');

    const prodDb = prodConn.db;
    const localDb = localConn.db;

    // Get all collections from production
    const collections = await prodDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in production\n`);

    let totalDocsCopied = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      const prodCollection = prodDb.collection(collectionName);
      const localCollection = localDb.collection(collectionName);

      const count = await prodCollection.countDocuments();

      if (count === 0) {
        console.log(`⚪ ${collectionName.padEnd(35)} 0 documents (skipped)`);
        continue;
      }

      console.log(`📦 ${collectionName.padEnd(35)} ${count} documents`);

      // Drop local collection if exists
      try {
        await localCollection.drop();
      } catch (err) {
        // Collection doesn't exist, that's fine
      }

      // Copy all documents
      const docs = await prodCollection.find({}).toArray();
      if (docs.length > 0) {
        await localCollection.insertMany(docs);
        totalDocsCopied += docs.length;
        console.log(`   ✅ Copied ${docs.length} documents to local`);
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('✅ COPY COMPLETE');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`📊 Total: ${totalDocsCopied} documents copied`);
    console.log('');
    console.log('💡 Your local MongoDB now has a copy of production data');
    console.log('   You can safely develop and test without affecting production!');
    console.log('');

    await prodConn.close();
    await localConn.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

copyProdToLocal();
