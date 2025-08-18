const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');

// Create a simple test server to debug file uploads
const app = express();

app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
}));

app.use(express.urlencoded({ extended: true }));

// Test endpoint that mimics the organization chart update
app.post('/test-upload', (req, res) => {
  console.log('\n🔍 DEBUG: Testing Organization Chart Upload');
  console.log('==========================================');
  
  console.log('\n📁 Files received:', req.files ? Object.keys(req.files) : 'No files');
  console.log('📝 Body fields received:', Object.keys(req.body));
  
  // List all expected photo fields
  const photoFields = [
    'advisor1_photo', 'advisor2_photo', 'advisor3_photo',
    'president_photo', 'vp1_photo', 'vp2_photo',
    'secretary_photo', 'treasurer_photo',
    'dev_committee_photo', 'tournament_committee_photo', 'disciplinary_committee_photo'
  ];
  
  console.log('\n🔍 Field Analysis:');
  console.log('==================');
  
  photoFields.forEach(field => {
    const hasFile = req.files && req.files[field];
    const fileInfo = hasFile ? `${req.files[field].name} (${req.files[field].size} bytes)` : 'No file';
    const status = hasFile ? '✅' : '❌';
    console.log(`${status} ${field}: ${fileInfo}`);
  });
  
  // Check if any files exist at all
  if (req.files) {
    console.log('\n📋 All files in request:');
    Object.keys(req.files).forEach(key => {
      console.log(`  - ${key}: ${req.files[key].name}`);
    });
  }
  
  // Check text fields for the problematic positions
  const textFields = [
    'vp2_name', 'vp2_phone',
    'secretary_name', 'secretary_phone',
    'treasurer_name', 'treasurer_phone',
    'dev_committee_name', 'dev_committee_phone',
    'tournament_committee_name', 'tournament_committee_phone',
    'disciplinary_committee_name', 'disciplinary_committee_phone'
  ];
  
  console.log('\n📝 Text Fields for Problematic Positions:');
  console.log('=========================================');
  
  textFields.forEach(field => {
    const hasValue = req.body[field];
    const status = hasValue ? '✅' : '❌';
    console.log(`${status} ${field}: ${hasValue || 'Missing'}`);
  });
  
  res.json({
    success: true,
    message: 'Debug upload test completed',
    filesReceived: req.files ? Object.keys(req.files) : [],
    bodyFields: Object.keys(req.body)
  });
});

// Serve a simple test form
app.get('/test-form', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Organization Chart Upload Test</title>
    </head>
    <body>
      <h1>Test Organization Chart Upload</h1>
      <form action="/test-upload" method="POST" enctype="multipart/form-data">
        
        <h3>VP2 (Problematic)</h3>
        <input type="text" name="vp2_name" value="Test VP2" required>
        <input type="tel" name="vp2_phone" value="+60123456789" required>
        <input type="file" name="vp2_photo" accept="image/*">
        
        <h3>Secretary (Problematic)</h3>
        <input type="text" name="secretary_name" value="Test Secretary" required>
        <input type="tel" name="secretary_phone" value="+60123456789" required>
        <input type="file" name="secretary_photo" accept="image/*">
        
        <h3>Treasurer (Problematic)</h3>
        <input type="text" name="treasurer_name" value="Test Treasurer" required>
        <input type="tel" name="treasurer_phone" value="+60123456789" required>
        <input type="file" name="treasurer_photo" accept="image/*">
        
        <br><br>
        <button type="submit">Test Upload</button>
      </form>
    </body>
    </html>
  `);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Debug upload server running on http://localhost:${PORT}`);
  console.log(`📝 Test form: http://localhost:${PORT}/test-form`);
  console.log('Use this to test if file uploads work for VP2, Secretary, Treasurer');
});