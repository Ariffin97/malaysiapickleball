/**
 * Test script for the New Unregistered Player API
 * This demonstrates how to use the API endpoints
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

async function testUnregisteredPlayerAPI() {
  try {
    console.log('🧪 Testing New Unregistered Player API');
    console.log('=====================================\n');

    // Step 1: Admin login to get session
    console.log('Step 1: Admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, ADMIN_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    const sessionCookie = loginResponse.headers['set-cookie'];
    console.log('✅ Admin logged in successfully\n');

    // Step 2: Generate API Key
    console.log('Step 2: Generating API Key...');
    const apiKeyResponse = await axios.post(`${BASE_URL}/admin/generate-api-key`, {
      description: 'Test API key for unregistered players',
      permissions: ['unregistered-player']
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

    // Step 3: Test the unregistered player endpoint
    console.log('Step 3: Testing Unregistered Player Registration...');
    
    const testNames = [
      'Ahmad Rahman',
      'Siti Nurhaliza',
      'John Doe',
      '李小明' // Chinese name test
    ];

    for (const name of testNames) {
      console.log(`Testing with name: "${name}"`);
      
      const playerResponse = await axios.post(`${BASE_URL}/unregistered-player`, {
        name: name
      }, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (playerResponse.data.success) {
        const data = playerResponse.data.data;
        console.log(`✅ MPA ID generated: ${data.mpaId}`);
        console.log(`   Name: ${data.name}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Registration Date: ${data.registrationDate}`);
      } else {
        console.log(`❌ Failed for "${name}":`, playerResponse.data.message);
      }
      console.log('');
    }

    // Step 4: Test API key management
    console.log('Step 4: Testing API Key Management...');
    
    // List API keys
    const listKeysResponse = await axios.get(`${BASE_URL}/admin/api-keys`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (listKeysResponse.data.success) {
      console.log('✅ API Keys listed:');
      listKeysResponse.data.data.apiKeys.forEach(key => {
        console.log(`   - ${key.keyId} (${key.description}) - Created by: ${key.createdBy}`);
      });
    }
    console.log('');

    // Step 5: Test error cases
    console.log('Step 5: Testing Error Cases...');
    
    // Test without API key
    try {
      await axios.post(`${BASE_URL}/unregistered-player`, {
        name: 'Test User'
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Correctly rejected request without API key');
      }
    }

    // Test with invalid API key
    try {
      await axios.post(`${BASE_URL}/unregistered-player`, {
        name: 'Test User'
      }, {
        headers: {
          'X-API-Key': 'invalid_key_12345'
        }
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Correctly rejected request with invalid API key');
      }
    }

    // Test with empty name
    try {
      await axios.post(`${BASE_URL}/unregistered-player`, {
        name: ''
      }, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Correctly validated empty name');
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
  console.log('\n📖 USAGE EXAMPLES');
  console.log('==================');
  
  console.log('\n1. Generate API Key (Admin only):');
  console.log('POST /api/admin/generate-api-key');
  console.log('Headers: Cookie: [admin session]');
  console.log('Body: { "description": "My API key", "permissions": ["unregistered-player"] }');
  
  console.log('\n2. Register Unregistered Player:');
  console.log('POST /api/unregistered-player');
  console.log('Headers: X-API-Key: [your-api-key]');
  console.log('Body: { "name": "Player Name" }');
  
  console.log('\n3. Example Response:');
  console.log(JSON.stringify({
    success: true,
    data: {
      name: "Ahmad Rahman",
      mpaId: "MPAAHMAD7423",
      registrationDate: "2024-01-15T08:30:00.000Z",
      status: "unregistered",
      message: "MPA ID generated successfully. Player can now register using this ID."
    },
    message: "New unregistered player processed successfully"
  }, null, 2));
  
  console.log('\n4. Integration Flow:');
  console.log('   a) Admin generates API key');
  console.log('   b) External system uses API key to register players');
  console.log('   c) System gets MPA ID back');
  console.log('   d) MPA ID is sent to the end receiver');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testUnregisteredPlayerAPI()
    .then(() => {
      showUsageExamples();
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testUnregisteredPlayerAPI,
  showUsageExamples
};