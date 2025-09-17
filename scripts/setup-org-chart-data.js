const { connectDB } = require('../config/database');
const DatabaseService = require('../services/databaseService');

async function setupOrgChartData() {
  try {
    console.log('🔧 Setting up organization chart data...');

    // Connect to MongoDB
    await connectDB();

    // Check if data already exists
    const existingData = await DatabaseService.getSetting('organization_chart_data', null);

    if (existingData) {
      console.log('⚠️  Organization chart data already exists. Backing up...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await DatabaseService.setSetting(`organization_chart_data_backup_${timestamp}`, existingData, 'system');
    }

    // Sample organization chart data with placeholder paths (will be updated when real images are uploaded)
    const orgChartData = {
      acting_president: {
        name: "Puan Delima Ibrahim",
        photo: "/uploads/org_chart/acting_president.jpg" // Will be updated to Cloudinary URL when uploaded
      },
      secretary: {
        name: "Puan Sally Jong Siew Nyuk",
        photo: "/uploads/org_chart/secretary.jpg"
      },
      disciplinary_chair: {
        name: "Cik Jenny Ting Hua Hung",
        photo: "/uploads/org_chart/disciplinary_chair.jpg"
      },
      dev_committee_chair: {
        name: "Prof. Dr. Mohamad Rahizam Abdul Rahim",
        photo: "/uploads/org_chart/dev_committee_chair.jpg"
      },
      dev_member1: {
        name: "En. Thor Meng Tatt",
        photo: "/uploads/org_chart/dev_member1.jpg"
      },
      dev_member2: {
        name: "En. Mohammad @ Razali bin Ibrahim",
        photo: "/uploads/org_chart/dev_member2.jpg"
      },
      committee_member: {
        name: "Cik Choong Wai Li",
        photo: "/uploads/org_chart/committee_member.jpg"
      }
    };

    // Save to database
    await DatabaseService.setSetting('organization_chart_data', JSON.stringify(orgChartData), 'system');

    console.log('✅ Organization chart data created successfully!');
    console.log('\n📊 Data Structure:');
    console.log('====================');
    Object.keys(orgChartData).forEach(position => {
      console.log(`${position.replace(/_/g, ' ')}: ${orgChartData[position].name}`);
    });

    console.log('\n📝 Next Steps:');
    console.log('==============');
    console.log('1. Start your server: node server-new.js');
    console.log('2. Go to admin panel: http://localhost:3001/admin/login');
    console.log('3. Navigate to Organization Chart management');
    console.log('4. Upload real photos for each position');
    console.log('5. The photos will be uploaded to Cloudinary and URLs updated automatically');

    console.log('\n🌐 Page URLs:');
    console.log('=============');
    console.log('Public page: http://localhost:3001/organization-chart');
    console.log('Admin panel: http://localhost:3001/admin/manage-organization-chart');

  } catch (error) {
    console.error('❌ Error setting up organization chart data:', error.message);
  } finally {
    process.exit(0);
  }
}

setupOrgChartData();