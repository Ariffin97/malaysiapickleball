const fetch = require('node-fetch');

// Base URL for API
const BASE_URL = 'http://localhost:3000/api';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  console.log(`\n--- ${options.method || 'GET'} ${endpoint} ---`);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return data;
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing API Health Check...');
  await apiRequest('/health');
}

async function testPlayerRegistration() {
  console.log('📝 Testing Player Registration...');
  
  // Test IC number check first
  const icNumber = '990101101234';
  await apiRequest(`/check-ic/${icNumber}`);
  
  // Test player registration
  const registrationData = {
    fullName: "John Doe",
    icNumber: icNumber,
    age: 25,
    address: "123 Main Street, Kuala Lumpur",
    phoneNumber: "+60123456789",
    email: "john@example.com",
    username: "johndoe",
    password: "SecurePass123"
  };
  
  await apiRequest('/player/register', {
    method: 'POST',
    body: JSON.stringify(registrationData)
  });
}

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...');
  
  const loginData = {
    username: "admin",
    password: "admin123" // Use your actual admin credentials
  };
  
  const response = await apiRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify(loginData)
  });
  
  return response.success;
}

async function testPlayerLogin() {
  console.log('🔐 Testing Player Login...');
  
  const loginData = {
    username: "johndoe",
    password: "SecurePass123"
  };
  
  const response = await apiRequest('/player/login', {
    method: 'POST',
    body: JSON.stringify(loginData)
  });
  
  return response.success;
}

async function testAdminFunctions() {
  console.log('👑 Testing Admin Functions...');
  
  // Get pending registrations
  await apiRequest('/admin/registrations/pending');
  
  // Get admin profile
  await apiRequest('/admin/profile');
  
  // Get all players
  await apiRequest('/admin/players?page=1&limit=5');
}

async function testPlayerProfile() {
  console.log('👤 Testing Player Profile...');
  
  await apiRequest('/player/profile');
}

async function testValidationErrors() {
  console.log('❌ Testing Validation Errors...');
  
  // Test invalid registration data
  const invalidData = {
    fullName: "A", // Too short
    icNumber: "123", // Invalid format
    age: 5, // Too young
    address: "Short", // Too short
    phoneNumber: "invalid", // Invalid format
    email: "invalid-email", // Invalid format
    username: "ab", // Too short
    password: "weak" // Too weak
  };
  
  await apiRequest('/player/register', {
    method: 'POST',
    body: JSON.stringify(invalidData)
  });
}

async function testRateLimit() {
  console.log('⚡ Testing Rate Limiting...');
  
  // Make multiple requests quickly
  for (let i = 0; i < 5; i++) {
    await apiRequest('/health');
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    // Basic tests
    await testHealthCheck();
    await testValidationErrors();
    await testPlayerRegistration();
    
    // Authentication tests
    const adminLoggedIn = await testAdminLogin();
    if (adminLoggedIn) {
      await testAdminFunctions();
    }
    
    const playerLoggedIn = await testPlayerLogin();
    if (playerLoggedIn) {
      await testPlayerProfile();
    }
    
    // Additional tests
    await testRateLimit();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  apiRequest,
  runTests,
  testHealthCheck,
  testPlayerRegistration,
  testAdminLogin,
  testPlayerLogin,
  testAdminFunctions,
  testPlayerProfile
}; 