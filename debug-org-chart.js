// Simple debugging script to check current state
const { connectDB } = require('./config/database');
const DatabaseService = require('./services/databaseService');

async function debugOrgChart() {
  try {
    console.log('🔧 Organization Chart Debug Analysis');
    console.log('=====================================\n');
    
    await connectDB();
    
    // Check current timestamp of the data
    const orgChartDataString = await DatabaseService.getSetting('organization_chart_data', null);
    
    if (orgChartDataString) {
      const Settings = require('./models/Settings');
      const setting = await Settings.findOne({ key: 'organization_chart_data' });
      
      console.log('📅 Last Database Update:');
      console.log('  Last Modified:', setting.lastModified);
      console.log('  Modified By:', setting.modifiedBy);
      console.log('  Updated At:', setting.updatedAt);
      
      const now = new Date();
      const lastUpdate = new Date(setting.updatedAt);
      const timeDiff = (now - lastUpdate) / (1000 * 60); // minutes
      
      console.log('  Time since last update:', Math.round(timeDiff), 'minutes ago');
      
      if (timeDiff < 10) {
        console.log('✅ Database was updated recently - uploads might be working');
      } else {
        console.log('❌ Database not updated recently - uploads not reaching server');
      }
    }
    
    // Check file timestamps
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, 'public/uploads/org_chart');
    
    console.log('\n📁 File Upload Directory Analysis:');
    
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      console.log('  Total files:', files.length);
      
      if (files.length > 0) {
        console.log('  Recent files:');
        files.forEach(file => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = (Date.now() - stats.mtime.getTime()) / (1000 * 60); // minutes
          console.log(`    ${file} - ${Math.round(fileAge)} minutes ago`);
        });
      }
    } else {
      console.log('  ❌ Upload directory does not exist');
    }
    
    // Check server status
    console.log('\n🖥️ Server Status Check:');
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3000/admin/login');
      console.log('  ✅ Server is responding (status:', response.status, ')');
    } catch (error) {
      console.log('  ❌ Server not responding:', error.message);
    }
    
    console.log('\n💡 Possible Issues:');
    console.log('===================');
    console.log('1. Browser cache - Try hard refresh (Ctrl+F5)');
    console.log('2. Form not reloaded - Refresh admin page');
    console.log('3. JavaScript errors - Check browser console');
    console.log('4. File size too large - Ensure images < 5MB');
    console.log('5. Network issues - Check browser network tab');
    
    console.log('\n🔧 Next Steps:');
    console.log('==============');
    console.log('1. Refresh the admin organization chart page');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Check Console tab for JavaScript errors');
    console.log('4. Check Network tab when submitting form');
    console.log('5. Try uploading a small test image (<1MB)');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    process.exit(0);
  }
}

debugOrgChart();