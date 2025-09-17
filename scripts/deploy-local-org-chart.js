/**
 * Production Deployment Script for Local Organization Chart Images
 *
 * This script sets up the organization chart with local images instead of Cloudinary.
 * All images are stored locally in the project and served by the web server.
 */

const mongoose = require('mongoose');
const DatabaseService = require('../services/databaseService');

async function deployLocalOrgChart() {
  try {
    console.log('🚀 Deploying Local Organization Chart for Production');
    console.log('===================================================\n');

    // Connect to database (uses MONGODB_URI from environment)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';
    console.log('🔗 Connecting to production database...');

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to database successfully');

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

    // Backup existing data
    const existingData = await DatabaseService.getSetting('organization_chart_data', null);
    if (existingData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await DatabaseService.setSetting(`org_chart_backup_${timestamp}`, existingData, 'local-deployment');
      console.log('💾 Existing data backed up');
    }

    // Save to database
    await DatabaseService.setSetting('organization_chart_data', JSON.stringify(orgChartData), 'local-deployment');
    console.log('✅ Organization chart data deployed with local images!');

    // Verify the deployment
    const verifyData = await DatabaseService.getSetting('organization_chart_data', null);
    if (verifyData) {
      const parsed = JSON.parse(verifyData);
      console.log('\n✅ Deployment Verification:');
      console.log('==========================');
      Object.entries(parsed).forEach(([position, data]) => {
        console.log(`${position.replace(/_/g, ' ').toUpperCase()}: ${data.name}`);
        console.log(`   Photo: ${data.photo}`);
      });
    }

    console.log('\n🎯 Local Images Deployment Complete!');
    console.log('====================================');

    console.log('\n✅ Benefits:');
    console.log('• No dependency on external services (Cloudinary)');
    console.log('• Faster loading (no external requests)');
    console.log('• Works in all environments');
    console.log('• Images bundled with application');
    console.log('• No additional configuration needed');

    console.log('\n📁 Image Files Location:');
    console.log('========================');
    console.log('Local directory: public/images/organization-chart/');
    console.log('Web accessible: /images/organization-chart/');
    console.log('');
    console.log('Files that should exist in production:');
    Object.entries(orgChartData).forEach(([position, data]) => {
      console.log(`• public${data.photo}`);
    });

    console.log('\n🚀 Production Deployment Steps:');
    console.log('===============================');
    console.log('1. ✅ Database updated (just completed)');
    console.log('2. Ensure public/images/organization-chart/ folder exists in production');
    console.log('3. Restart your application');
    console.log('4. Test: https://your-domain.com/organization-chart');
    console.log('5. All images should load from local paths');

    console.log('\n🔧 Troubleshooting:');
    console.log('==================');
    console.log('If images don\'t load:');
    console.log('• Check that public/images/organization-chart/ folder exists');
    console.log('• Verify image files are present and have correct names');
    console.log('• Check web server is serving static files from public/');
    console.log('• Verify file permissions allow reading');

  } catch (error) {
    console.error('❌ Deployment Error:', error.message);
    console.error('❌ Stack:', error.stack);

    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check database connection (MONGODB_URI)');
    console.log('2. Verify database credentials');
    console.log('3. Ensure you have write permissions to database');
    console.log('4. Check network connectivity');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

deployLocalOrgChart();