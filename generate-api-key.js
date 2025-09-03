/**
 * Quick API Key Generator for Player Details
 * This script helps you generate API keys with Player Details permission
 */

const axios = require('axios');
const readline = require('readline');

// Configuration - Update port if your server runs on different port
const BASE_URL = 'http://localhost:3001/api';  // Using port 3001

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function generatePlayerDetailsApiKey() {
  try {
    console.log('🔑 API Key Generator for Player Details');
    console.log('====================================\n');

    // Ask for admin credentials
    console.log('Please provide your admin credentials:');
    const username = await askQuestion('Username: ');
    const password = await askQuestion('Password: ');
    
    console.log('\n🔐 Logging in as admin...');
    
    // Step 1: Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
      username: username,
      password: password
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Admin login failed: ' + loginResponse.data.message);
    }
    
    const sessionCookie = loginResponse.headers['set-cookie'];
    console.log('✅ Admin login successful!');

    // Ask for API key description
    const description = await askQuestion('\nEnter description for your API key (e.g., "Player Management System"): ');

    // Ask for permissions
    console.log('\nSelect permissions for your API key:');
    console.log('1. Unregistered Player Registration only');
    console.log('2. Player Details Management only');  
    console.log('3. Both permissions (recommended)');
    
    const choice = await askQuestion('Enter your choice (1/2/3): ');
    
    let permissions = [];
    switch(choice) {
      case '1':
        permissions = ['unregistered-player'];
        break;
      case '2':
        permissions = ['player-details'];
        break;
      case '3':
      default:
        permissions = ['unregistered-player', 'player-details'];
        break;
    }

    console.log('\n🔑 Generating API key...');
    
    // Step 2: Generate API key
    const apiKeyResponse = await axios.post(`${BASE_URL}/admin/generate-api-key`, {
      description: description,
      permissions: permissions
    }, {
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (!apiKeyResponse.data.success) {
      throw new Error('API key generation failed: ' + apiKeyResponse.data.message);
    }

    const apiKeyData = apiKeyResponse.data.data;
    
    console.log('\n🎉 API Key Generated Successfully!');
    console.log('==================================');
    console.log(`Description: ${apiKeyData.description}`);
    console.log(`Permissions: ${apiKeyData.permissions.join(', ')}`);
    console.log(`Created: ${new Date(apiKeyData.createdAt).toLocaleString()}`);
    console.log('\n🔐 Your API Key:');
    console.log('================');
    console.log(`${apiKeyData.apiKey}`);
    
    console.log('\n⚠️  IMPORTANT: Save this key securely! It won\'t be shown again.');
    
    console.log('\n📖 Usage Examples:');
    console.log('===================');
    
    if (permissions.includes('unregistered-player')) {
      console.log('\n1. Register Unregistered Player:');
      console.log('curl -X POST http://localhost:3001/api/unregistered-player \\');
      console.log('  -H "X-API-Key: ' + apiKeyData.apiKey + '" \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"name": "Ahmad Rahman"}\'');
    }
    
    if (permissions.includes('player-details')) {
      console.log('\n2. Get Player Details:');
      console.log('curl -H "X-API-Key: ' + apiKeyData.apiKey + '" \\');
      console.log('  http://localhost:3001/api/player-details/MPAAHMAD1234');
      
      console.log('\n3. Create Player with Details:');
      console.log('curl -X POST http://localhost:3001/api/player-details \\');
      console.log('  -H "X-API-Key: ' + apiKeyData.apiKey + '" \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"fullName": "Ahmad Rahman", "state": "Selangor", "division": "Open (19-39)", "email": "ahmad@email.com"}\'');
      
      console.log('\n4. Search Players by State:');
      console.log('curl -H "X-API-Key: ' + apiKeyData.apiKey + '" \\');
      console.log('  "http://localhost:3001/api/players/search?state=Selangor&limit=10"');
    }
    
    console.log('\n🔧 Available States:');
    console.log('Johor, Kedah, Kelantan, Kuala Lumpur, Labuan, Malacca, Negeri Sembilan, Pahang, Penang, Perak, Perlis, Putrajaya, Sabah, Sarawak, Selangor, Terengganu');
    
    console.log('\n🏆 Available Divisions:');
    console.log('Youth (Under 16), Junior (16-18), Open (19-39), Senior (40-49), Masters (50-59), Grand Masters (60+), Professional');
    
    console.log('\n📚 For more details, see: UNREGISTERED_PLAYER_API.md');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your server is running:');
      console.log('   npm start');
      console.log('\n💡 Or check if your server is running on a different port (like 3001)');
      console.log('   Update BASE_URL in this script if needed');
    }
  } finally {
    rl.close();
  }
}

// Instructions for different server ports
function showServerInstructions() {
  console.log('🌐 Server Connection Instructions:');
  console.log('==================================');
  console.log('If your server is running on port 3001, edit this script and change:');
  console.log('const BASE_URL = \'http://localhost:3001/api\';');
  console.log('');
  console.log('You can also check which port your server is using by looking at the startup logs.');
  console.log('');
}

// Show instructions if server connection fails
process.on('unhandledRejection', (reason, promise) => {
  if (reason.code === 'ECONNREFUSED') {
    showServerInstructions();
  }
});

// Run the script
if (require.main === module) {
  generatePlayerDetailsApiKey();
}

module.exports = { generatePlayerDetailsApiKey };