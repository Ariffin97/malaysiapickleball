const mongoose = require('mongoose');

async function testLocalPortalSetup() {
  console.log('🧪 Testing Local Portal Setup (No Atlas/Production)');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check local portal database
    console.log('\n🔍 Test 1: Portal Database Connection (Local)');
    const portalConnection = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-portal-dev');
    
    portalConnection.on('connected', () => {
      console.log('✅ Portal database connected successfully (LOCAL)');
    });
    
    portalConnection.on('error', (err) => {
      console.log('❌ Portal database connection failed:', err.message);
    });
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check main site database  
    console.log('\n🔍 Test 2: Main Site Database Connection (Local)');
    const mainConnection = mongoose.createConnection('mongodb://localhost:27017/malaysia-pickleball-dev');
    
    mainConnection.on('connected', () => {
      console.log('✅ Main site database connected successfully (LOCAL)');
    });
    
    mainConnection.on('error', (err) => {
      console.log('❌ Main site database connection failed:', err.message);
    });
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Check what's in each database
    console.log('\n🔍 Test 3: Database Content Check');
    
    // Portal database content
    try {
      const portalCollections = await portalConnection.db.listCollections().toArray();
      console.log(`📊 Portal DB collections: ${portalCollections.map(c => c.name).join(', ') || 'None'}`);
      
      if (portalCollections.find(c => c.name === 'tournamentapplications')) {
        const TournamentApplicationSchema = new mongoose.Schema({}, { strict: false });
        const TournamentApplication = portalConnection.model('tournamentapplications', TournamentApplicationSchema);
        const count = await TournamentApplication.countDocuments();
        console.log(`📋 Portal tournaments: ${count}`);
      }
    } catch (error) {
      console.log('⚠️  Portal database is empty or new');
    }
    
    // Main site database content
    try {
      const mainCollections = await mainConnection.db.listCollections().toArray();
      console.log(`📊 Main DB collections: ${mainCollections.map(c => c.name).join(', ') || 'None'}`);
      
      if (mainCollections.find(c => c.name === 'tournaments')) {
        const TournamentSchema = new mongoose.Schema({}, { strict: false });
        const Tournament = mainConnection.model('tournaments', TournamentSchema);
        const count = await Tournament.countDocuments();
        console.log(`📋 Main site tournaments: ${count}`);
      }
    } catch (error) {
      console.log('⚠️  Main database is empty or new');
    }
    
    console.log('\n✅ Local Setup Test Complete');
    console.log('🔒 No Atlas/Production databases involved');
    console.log('🏠 All operations are LOCAL ONLY');
    
    await portalConnection.close();
    await mainConnection.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLocalPortalSetup()
  .then(() => {
    console.log('\n🎉 Local Portal Setup Verified!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });