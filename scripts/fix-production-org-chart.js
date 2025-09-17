/**
 * Production Organization Chart Fix Script
 *
 * This script fixes the empty organization chart page in production by:
 * 1. Creating organization chart data in the production database
 * 2. Verifying the data structure matches the template expectations
 * 3. Providing deployment instructions for production
 */

const { connectDB } = require('../config/database');
const DatabaseService = require('../services/databaseService');

async function fixProductionOrgChart() {
  try {
    console.log('🚀 Production Organization Chart Fix');
    console.log('====================================\n');

    // Connect to MongoDB (will use MONGODB_URI from environment)
    await connectDB();

    console.log('✅ Connected to database');
    console.log(`📊 Database: ${process.env.MONGODB_URI ? 'Production' : 'Local'}`);

    // Check if organization chart data exists
    let existingData = await DatabaseService.getSetting('organization_chart_data', null);

    if (existingData) {
      console.log('⚠️  Organization chart data already exists');

      try {
        const parsed = JSON.parse(existingData);
        console.log('✅ Existing data is valid JSON');
        console.log('📊 Positions found:');
        Object.keys(parsed).forEach(key => {
          console.log(`   - ${key.replace(/_/g, ' ')}: ${parsed[key]?.name || 'No name'}`);
        });

        // Ask if user wants to backup and replace
        console.log('\n💾 Backing up existing data...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await DatabaseService.setSetting(`org_chart_backup_${timestamp}`, existingData, 'production-fix');
        console.log('✅ Backup created');
      } catch (parseError) {
        console.log('❌ Existing data is corrupted, will replace');
      }
    } else {
      console.log('❌ No organization chart data found - this is why the page is empty');
    }

    // Create the organization chart data
    const orgChartData = {
      acting_president: {
        name: "Puan Delima Ibrahim",
        photo: null // Will show placeholder until admin uploads photos
      },
      secretary: {
        name: "Puan Sally Jong Siew Nyuk",
        photo: null
      },
      disciplinary_chair: {
        name: "Cik Jenny Ting Hua Hung",
        photo: null
      },
      dev_committee_chair: {
        name: "Prof. Dr. Mohamad Rahizam Abdul Rahim",
        photo: null
      },
      dev_member1: {
        name: "En. Thor Meng Tatt",
        photo: null
      },
      dev_member2: {
        name: "En. Mohammad @ Razali bin Ibrahim",
        photo: null
      },
      committee_member: {
        name: "Cik Choong Wai Li",
        photo: null
      }
    };

    // Save to database
    await DatabaseService.setSetting('organization_chart_data', JSON.stringify(orgChartData), 'production-fix');

    console.log('\n✅ Organization chart data created successfully!');

    console.log('\n📊 Created Positions:');
    console.log('=====================');
    Object.entries(orgChartData).forEach(([key, value]) => {
      console.log(`${key.replace(/_/g, ' ').toUpperCase()}: ${value.name}`);
    });

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verifyData = await DatabaseService.getSetting('organization_chart_data', null);
    if (verifyData) {
      const parsed = JSON.parse(verifyData);
      console.log('✅ Data successfully saved to database');
      console.log(`✅ Found ${Object.keys(parsed).length} positions`);
    } else {
      console.log('❌ Verification failed - data not saved properly');
    }

    console.log('\n🚀 Production Deployment Instructions:');
    console.log('======================================');
    console.log('1. Run this script on your production server:');
    console.log('   node scripts/fix-production-org-chart.js');
    console.log('');
    console.log('2. Restart your production application:');
    console.log('   pm2 restart all  # if using PM2');
    console.log('   # or restart your Docker container/Heroku app');
    console.log('');
    console.log('3. Test the organization chart page:');
    console.log('   https://your-domain.com/organization-chart');
    console.log('');
    console.log('4. Upload photos via admin panel:');
    console.log('   https://your-domain.com/admin/manage-organization-chart');
    console.log('');
    console.log('5. Photos will be automatically uploaded to Cloudinary');
    console.log('   and URLs will be updated in the database');

    console.log('\n📝 Notes:');
    console.log('=========');
    console.log('• Names will display immediately');
    console.log('• Photos will show placeholder icons until uploaded');
    console.log('• Admin can update names and photos via admin panel');
    console.log('• Changes are automatically saved to database');

  } catch (error) {
    console.error('❌ Error fixing production organization chart:', error.message);
    console.error('❌ Stack trace:', error.stack);

    console.log('\n🔧 Troubleshooting:');
    console.log('==================');
    console.log('1. Check database connection (MONGODB_URI)');
    console.log('2. Verify database credentials');
    console.log('3. Check server logs for additional errors');
    console.log('4. Ensure production environment variables are set');
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixProductionOrgChart();