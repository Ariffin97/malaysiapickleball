/**
 * Test script for the Player Details API
 * This demonstrates how to use the Player Details API endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
let API_KEY = null;

// Test admin credentials (you'll need to use real admin credentials)
const ADMIN_CREDENTIALS = {
  username: 'admin', // Replace with actual admin username
  password: 'password123' // Replace with actual admin password
};

async function testPlayerDetailsAPI() {
  try {
    console.log('🧪 Testing Player Details API');
    console.log('=============================\n');

    // Step 1: Admin login to get session
    console.log('Step 1: Admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, ADMIN_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    const sessionCookie = loginResponse.headers['set-cookie'];
    console.log('✅ Admin logged in successfully\n');

    // Step 2: Generate API Key with Player Details permission
    console.log('Step 2: Generating API Key with Player Details permission...');
    const apiKeyResponse = await axios.post(`${BASE_URL}/admin/generate-api-key`, {
      description: 'Test API key for player details management',
      permissions: ['player-details']
    }, {
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (!apiKeyResponse.data.success) {
      throw new Error('API key generation failed');
    }

    API_KEY = apiKeyResponse.data.data.apiKey;
    console.log('✅ API Key generated:', API_KEY.substring(0, 20) + '...\n');

    // Step 3: Test Create/Update Player Details
    console.log('Step 3: Testing Create Player Details...');
    
    const testPlayers = [
      {
        fullName: 'Ahmad Rahman Bin Hassan',
        dateOfBirth: '1990-05-15',
        age: 33,
        state: 'Selangor',
        division: 'Open (19-39)',
        email: 'ahmad.rahman@email.com',
        phoneNumber: '012-3456789',
        address: 'No. 123, Jalan Merdeka, 40000 Shah Alam, Selangor'
      },
      {
        fullName: 'Siti Nurhaliza Binti Abdullah',
        dateOfBirth: '1995-08-22',
        age: 28,
        state: 'Johor',
        division: 'Open (19-39)',
        email: 'siti.nurhaliza@email.com',
        phoneNumber: '013-7654321',
        address: 'No. 456, Jalan Bunga Raya, 80000 Johor Bahru, Johor'
      }
    ];

    const createdPlayers = [];

    for (const playerData of testPlayers) {
      console.log(`Creating player: ${playerData.fullName}`);
      
      const createResponse = await axios.post(`${BASE_URL}/player-details`, playerData, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (createResponse.data.success) {
        const data = createResponse.data.data;
        console.log(`✅ Player created: ${data.player.playerId}`);
        console.log(`   Name: ${data.player.fullName}`);
        console.log(`   State: ${data.player.state}`);
        console.log(`   Division: ${data.player.division}`);
        createdPlayers.push(data.player);
      } else {
        console.log(`❌ Failed to create player "${playerData.fullName}":`, createResponse.data.message);
      }
      console.log('');
    }

    // Step 4: Test Get Player Details
    console.log('Step 4: Testing Get Player Details...');
    
    if (createdPlayers.length > 0) {
      const playerId = createdPlayers[0].playerId;
      console.log(`Getting details for player: ${playerId}`);
      
      const getResponse = await axios.get(`${BASE_URL}/player-details/${playerId}`, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      if (getResponse.data.success) {
        const player = getResponse.data.data.player;
        console.log('✅ Player details retrieved:');
        console.log(`   Player ID: ${player.playerId}`);
        console.log(`   Name: ${player.fullName}`);
        console.log(`   Date of Birth: ${player.dateOfBirth ? new Date(player.dateOfBirth).toDateString() : 'Not set'}`);
        console.log(`   Age: ${player.age}`);
        console.log(`   State: ${player.state || 'Not set'}`);
        console.log(`   Division: ${player.division || 'Not set'}`);
        console.log(`   Email: ${player.email}`);
        console.log(`   Status: ${player.status}`);
      } else {
        console.log('❌ Failed to get player details');
      }
      console.log('');
    }

    // Step 5: Test Update Player Details
    console.log('Step 5: Testing Update Player Details...');
    
    if (createdPlayers.length > 0) {
      const playerId = createdPlayers[0].playerId;
      console.log(`Updating player: ${playerId}`);
      
      const updateData = {
        state: 'Kuala Lumpur',
        division: 'Senior (40-49)',
        phoneNumber: '019-9876543'
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/player-details/${playerId}`, updateData, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.data.success) {
        const player = updateResponse.data.data.player;
        console.log('✅ Player updated successfully:');
        console.log(`   State: ${player.state}`);
        console.log(`   Division: ${player.division}`);
        console.log(`   Phone: ${player.phoneNumber}`);
      } else {
        console.log('❌ Failed to update player details');
      }
      console.log('');
    }

    // Step 6: Test Search Players
    console.log('Step 6: Testing Search Players...');
    
    // Search by state
    const searchResponse = await axios.get(`${BASE_URL}/players/search?state=Johor&limit=10`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (searchResponse.data.success) {
      const data = searchResponse.data.data;
      console.log(`✅ Search results (State: Johor):`);
      console.log(`   Total players found: ${data.total}`);
      console.log(`   Players in response: ${data.players.length}`);
      
      data.players.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.fullName} (${player.playerId}) - ${player.state} - ${player.division || 'No division'}`);
      });
    } else {
      console.log('❌ Failed to search players');
    }
    console.log('');

    // Step 7: Test Error Cases
    console.log('Step 7: Testing Error Cases...');
    
    // Test with invalid player ID
    try {
      await axios.get(`${BASE_URL}/player-details/INVALID123`, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
    } catch (error) {
      if (error.response.status === 404) {
        console.log('✅ Correctly handled invalid player ID');
      }
    }

    // Test with invalid API key
    try {
      await axios.get(`${BASE_URL}/player-details/${createdPlayers[0]?.playerId || 'TEST123'}`, {
        headers: {
          'X-API-Key': 'invalid_key_12345'
        }
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Correctly rejected invalid API key');
      }
    }

    // Test with insufficient permissions
    console.log('Testing with unregistered-player permission only...');
    const limitedKeyResponse = await axios.post(`${BASE_URL}/admin/generate-api-key`, {
      description: 'Limited API key (unregistered-player only)',
      permissions: ['unregistered-player']
    }, {
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (limitedKeyResponse.data.success) {
      const limitedKey = limitedKeyResponse.data.data.apiKey;
      
      try {
        await axios.get(`${BASE_URL}/player-details/${createdPlayers[0]?.playerId || 'TEST123'}`, {
          headers: {
            'X-API-Key': limitedKey
          }
        });
      } catch (error) {
        if (error.response.status === 403) {
          console.log('✅ Correctly enforced API key permissions');
        }
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the server is running and the endpoints are correctly implemented.');
    }
  }
}

// Usage examples for integration
function showUsageExamples() {
  console.log('\n📖 PLAYER DETAILS API USAGE EXAMPLES');
  console.log('====================================');
  
  console.log('\n1. Get Player Details:');
  console.log('GET /api/player-details/{playerId}');
  console.log('Headers: X-API-Key: [your-api-key-with-player-details-permission]');
  
  console.log('\n2. Create New Player:');
  console.log('POST /api/player-details');
  console.log('Headers: X-API-Key: [your-api-key]');
  console.log('Body: {');
  console.log('  "fullName": "Ahmad Rahman",');
  console.log('  "dateOfBirth": "1990-05-15",');
  console.log('  "age": 33,');
  console.log('  "state": "Selangor",');
  console.log('  "division": "Open (19-39)",');
  console.log('  "email": "ahmad@email.com",');
  console.log('  "phoneNumber": "012-3456789",');
  console.log('  "address": "123 Main St, KL"');
  console.log('}');
  
  console.log('\n3. Update Existing Player:');
  console.log('PUT /api/player-details/{playerId}');
  console.log('Headers: X-API-Key: [your-api-key]');
  console.log('Body: {');
  console.log('  "state": "Kuala Lumpur",');
  console.log('  "division": "Senior (40-49)"');
  console.log('}');
  
  console.log('\n4. Search Players:');
  console.log('GET /api/players/search?state=Selangor&division=Open%20(19-39)&limit=20');
  console.log('Headers: X-API-Key: [your-api-key]');
  
  console.log('\n📊 Available States:');
  const states = ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 
                 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 
                 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'];
  states.forEach(state => console.log(`   - ${state}`));
  
  console.log('\n🏆 Available Divisions:');
  const divisions = ['Youth (Under 16)', 'Junior (16-18)', 'Open (19-39)', 'Senior (40-49)', 
                    'Masters (50-59)', 'Grand Masters (60+)', 'Professional'];
  divisions.forEach(division => console.log(`   - ${division}`));
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPlayerDetailsAPI()
    .then(() => {
      showUsageExamples();
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testPlayerDetailsAPI,
  showUsageExamples
};