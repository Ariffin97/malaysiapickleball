/**
 * Demo Setup Script for Unregistered Player API
 * This script helps set up the API for testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function createDemoAdmin() {
  try {
    console.log('🔧 Setting up demo admin account...');
    
    // This is a mock function - you'll need to create the admin manually
    // or use your existing admin creation process
    console.log('ℹ️  Please create an admin account manually if you don\'t have one:');
    console.log('   Username: admin');
    console.log('   Password: password123');
    console.log('   Email: admin@example.com');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up demo admin:', error.message);
    return false;
  }
}

async function testApiAccess() {
  try {
    console.log('🧪 Testing API access...');
    
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.data.success) {
      console.log('✅ API is accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ API access test failed:', error.message);
    return false;
  }
}

async function showInstructions() {
  console.log('\n📖 SETUP INSTRUCTIONS');
  console.log('====================');
  
  console.log('\n1. Start the server:');
  console.log('   npm start');
  
  console.log('\n2. Access admin panel:');
  console.log(`   ${BASE_URL}/admin/dashboard`);
  
  console.log('\n3. Login with admin credentials');
  
  console.log('\n4. Navigate to API Keys section:');
  console.log(`   ${BASE_URL}/admin/api-keys`);
  
  console.log('\n5. Generate a new API key:');
  console.log('   - Click "Generate New API Key"');
  console.log('   - Enter description (e.g., "Test Integration")');
  console.log('   - Click "Generate Key"');
  console.log('   - Copy and save the generated API key');
  
  console.log('\n6. Test the API:');
  console.log('   Use the test script: node test-unregistered-player-api.js');
  
  console.log('\n7. API Usage Example:');
  console.log('   curl -X POST http://localhost:3000/api/unregistered-player \\');
  console.log('        -H "X-API-Key: YOUR_API_KEY_HERE" \\');
  console.log('        -H "Content-Type: application/json" \\');
  console.log('        -d \'{"name": "Ahmad Rahman"}\'');
  
  console.log('\n8. Expected Response:');
  console.log('   {');
  console.log('     "success": true,');
  console.log('     "data": {');
  console.log('       "name": "Ahmad Rahman",');
  console.log('       "mpaId": "MPAAHMAD7423",');
  console.log('       "registrationDate": "2024-01-15T08:30:00.000Z",');
  console.log('       "status": "unregistered"');
  console.log('     }');
  console.log('   }');
  
  console.log('\n🔐 SECURITY NOTES:');
  console.log('=================');
  console.log('• Store API keys securely');
  console.log('• Use HTTPS in production');
  console.log('• Monitor API key usage');
  console.log('• Rotate keys regularly');
  console.log('• Revoke unused keys');
}

async function checkServerStatus() {
  try {
    console.log('🔍 Checking server status...');
    const response = await axios.get(`${BASE_URL}`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running');
    console.log('   Please start the server with: npm start');
    return false;
  }
}

async function main() {
  console.log('🚀 Unregistered Player API Setup');
  console.log('=================================\n');
  
  // Check server status
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('\n💡 Start the server first, then run this script again.');
    return;
  }
  
  // Test API access
  await testApiAccess();
  
  // Show setup instructions
  await showInstructions();
  
  console.log('\n🎉 Setup complete! Follow the instructions above to start using the API.');
  console.log('\n📚 For detailed documentation, see: UNREGISTERED_PLAYER_API.md');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkServerStatus,
  testApiAccess,
  showInstructions
};