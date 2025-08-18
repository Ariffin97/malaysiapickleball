// Test script to simulate form upload and see debug output
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('🧪 Testing organization chart upload...');
    
    // Create a small test image file
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Create a minimal 1x1 pixel JPEG for testing
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xAA, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, minimalJpeg);
    console.log('✅ Created test image:', testImagePath);
    
    // Create form data
    const formData = new FormData();
    
    // Add required text fields
    formData.append('president_name', 'Test President');
    formData.append('president_phone', '+60123456789');
    
    // Add test data for problematic fields
    formData.append('vp2_name', 'Test VP2');
    formData.append('vp2_phone', '+60123456790');
    formData.append('secretary_name', 'Test Secretary');
    formData.append('secretary_phone', '+60123456791');
    
    // Add test image for VP2 (problematic field)
    formData.append('vp2_photo', fs.createReadStream(testImagePath), 'test-vp2.jpg');
    formData.append('secretary_photo', fs.createReadStream(testImagePath), 'test-secretary.jpg');
    
    console.log('📤 Submitting test upload...');
    
    // Submit to the organization chart update endpoint
    const response = await axios.post('http://localhost:3000/admin/organization-chart/update', formData, {
      headers: {
        ...formData.getHeaders(),
        'Cookie': 'connect.sid=test-session' // Basic session cookie
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Upload response:', response.status);
    console.log('📄 Response redirect:', response.headers.location || 'No redirect');
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test image');
    
  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    // Clean up test file even on error
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

testUpload();