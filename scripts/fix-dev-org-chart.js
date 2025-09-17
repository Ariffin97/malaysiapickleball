const mongoose = require('mongoose');
const DatabaseService = require('../services/databaseService');

async function fixDevOrgChart() {
  try {
    console.log('🔧 Fixing DEV database organization chart...');

    // Connect directly to the DEV database (same as server uses)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball-dev';
    console.log('🔗 Connecting to:', mongoURI);

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to development database');

    // Organization chart data with LOCAL image paths
    const orgChartData = {
      acting_president: {
        name: "Puan Delima Ibrahim",
        photo: "/images/organization-chart/acting_president.jpg"
      },
      secretary: {
        name: "Puan Sally Jong Siew Nyuk",
        photo: "/images/organization-chart/secretary.jpg"
      },
      disciplinary_chair: {
        name: "Cik Jenny Ting Hua Hung",
        photo: "/images/organization-chart/disciplinary_chair.jpg"
      },
      dev_committee_chair: {
        name: "Prof. Dr. Mohamad Rahizam Abdul Rahim",
        photo: "/images/organization-chart/dev_committee_chair.jpg"
      },
      dev_member1: {
        name: "En. Thor Meng Tatt",
        photo: "/images/organization-chart/dev_member1.jpg"
      },
      dev_member2: {
        name: "En. Mohammad @ Razali bin Ibrahim",
        photo: "/images/organization-chart/dev_member2.jpg"
      },
      committee_member: {
        name: "Cik Choong Wai Li",
        photo: "/images/organization-chart/committee_member.jpg"
      }
    };

    // Save to database using DatabaseService
    await DatabaseService.setSetting('organization_chart_data', JSON.stringify(orgChartData), 'dev-fix');

    console.log('✅ Organization chart data updated in DEV database!');

    // Verify the data
    const verifyData = await DatabaseService.getSetting('organization_chart_data', null);
    if (verifyData) {
      const parsed = JSON.parse(verifyData);
      console.log('\n✅ Verification successful:');
      console.log('Acting President Photo:', parsed.acting_president?.photo);
      console.log('Secretary Photo:', parsed.secretary?.photo);
    }

    console.log('\n🎯 Now restart your server and test the page!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixDevOrgChart();