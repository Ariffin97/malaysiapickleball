const { connectDB } = require('../config/database');
const DatabaseService = require('../services/databaseService');

async function setupLocalOrgChartImages() {
  try {
    console.log('🖼️  Setting up organization chart with local images...');

    // Connect to MongoDB
    await connectDB();

    // Organization chart data with LOCAL image paths (no Cloudinary)
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

    // Backup existing data if it exists
    const existingData = await DatabaseService.getSetting('organization_chart_data', null);
    if (existingData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await DatabaseService.setSetting(`org_chart_backup_${timestamp}`, existingData, 'local-images-setup');
      console.log('✅ Existing data backed up');
    }

    // Save to database
    await DatabaseService.setSetting('organization_chart_data', JSON.stringify(orgChartData), 'local-images-setup');

    console.log('✅ Organization chart data updated with local images!');

    console.log('\n📊 Local Image Paths:');
    console.log('======================');
    Object.entries(orgChartData).forEach(([position, data]) => {
      console.log(`${position.replace(/_/g, ' ').toUpperCase()}: ${data.name}`);
      console.log(`   Image: ${data.photo}`);
      console.log('');
    });

    console.log('🎯 Benefits of Local Images:');
    console.log('============================');
    console.log('✅ No dependency on Cloudinary');
    console.log('✅ Images bundled with your application');
    console.log('✅ Faster loading (no external requests)');
    console.log('✅ Works offline and in all environments');
    console.log('✅ No additional configuration needed');

    console.log('\n📁 File Locations:');
    console.log('==================');
    console.log('Images stored in: public/images/organization-chart/');
    console.log('Accessible at: http://your-domain.com/images/organization-chart/');

    console.log('\n🚀 Deployment Instructions:');
    console.log('===========================');
    console.log('1. Copy the public/images/organization-chart/ folder to production');
    console.log('2. Run this script: node scripts/setup-local-org-chart-images.js');
    console.log('3. Restart your application');
    console.log('4. All images will load from local files');

    // Verify images exist
    const fs = require('fs');
    const path = require('path');

    console.log('\n🔍 Verifying Image Files:');
    console.log('=========================');
    Object.entries(orgChartData).forEach(([position, data]) => {
      const imagePath = path.join(__dirname, '..', 'public', data.photo);
      if (fs.existsSync(imagePath)) {
        const stats = fs.statSync(imagePath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`✅ ${position}: ${sizeKB}KB - ${data.photo}`);
      } else {
        console.log(`❌ ${position}: MISSING - ${data.photo}`);
      }
    });

  } catch (error) {
    console.error('❌ Error setting up local organization chart images:', error.message);
  } finally {
    process.exit(0);
  }
}

setupLocalOrgChartImages();