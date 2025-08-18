const { connectDB } = require('../config/database');
const DatabaseService = require('../services/databaseService');

async function checkOrgChartData() {
  try {
    console.log('🔍 Checking organization chart data...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Get organization chart data
    const orgChartDataString = await DatabaseService.getSetting('organization_chart_data', null);
    
    if (!orgChartDataString) {
      console.log('❌ No organization chart data found in database');
      return;
    }
    
    const orgChartData = JSON.parse(orgChartDataString);
    
    console.log('\n📊 Organization Chart Data Analysis:');
    console.log('=====================================');
    
    // Check Vice Presidents
    console.log('\n👥 Vice Presidents:');
    if (orgChartData.vicePresidents) {
      orgChartData.vicePresidents.forEach((vp, index) => {
        console.log(`  VP${index + 1}:`);
        console.log(`    Name: ${vp.name}`);
        console.log(`    Phone: ${vp.phone}`);
        console.log(`    Photo: ${vp.photo || 'No photo'}`);
      });
    } else {
      console.log('  ❌ No vice presidents data found');
    }
    
    // Check Secretary
    console.log('\n📝 Secretary:');
    if (orgChartData.secretary) {
      console.log(`  Name: ${orgChartData.secretary.name}`);
      console.log(`  Phone: ${orgChartData.secretary.phone}`);
      console.log(`  Photo: ${orgChartData.secretary.photo || 'No photo'}`);
    } else {
      console.log('  ❌ No secretary data found');
    }
    
    // Check Treasurer
    console.log('\n💰 Treasurer:');
    if (orgChartData.treasurer) {
      console.log(`  Name: ${orgChartData.treasurer.name}`);
      console.log(`  Phone: ${orgChartData.treasurer.phone}`);
      console.log(`  Photo: ${orgChartData.treasurer.photo || 'No photo'}`);
    } else {
      console.log('  ❌ No treasurer data found');
    }
    
    // Check Committees
    console.log('\n🏛️ Committees:');
    if (orgChartData.committees) {
      orgChartData.committees.forEach((committee, index) => {
        console.log(`  Committee ${index + 1} (${committee.type}):`);
        console.log(`    Name: ${committee.name}`);
        console.log(`    Phone: ${committee.phone}`);
        console.log(`    Photo: ${committee.photo || 'No photo'}`);
      });
    } else {
      console.log('  ❌ No committees data found');
    }
    
    // Check photo paths specifically
    console.log('\n📸 Photo Path Analysis:');
    console.log('========================');
    
    const positions = [
      { name: 'VP1', photo: orgChartData.vicePresidents?.[0]?.photo },
      { name: 'VP2', photo: orgChartData.vicePresidents?.[1]?.photo },
      { name: 'Secretary', photo: orgChartData.secretary?.photo },
      { name: 'Treasurer', photo: orgChartData.treasurer?.photo },
      { name: 'Dev Committee', photo: orgChartData.committees?.[0]?.photo },
      { name: 'Tournament Committee', photo: orgChartData.committees?.[1]?.photo },
      { name: 'Disciplinary Committee', photo: orgChartData.committees?.[2]?.photo }
    ];
    
    positions.forEach(pos => {
      if (!pos.photo || pos.photo === null || pos.photo === 'null') {
        console.log(`❌ ${pos.name}: No photo (${pos.photo})`);
      } else if (pos.photo.includes('👨‍💼') || pos.photo.includes('👩‍💼')) {
        console.log(`⚠️  ${pos.name}: Default emoji (${pos.photo})`);
      } else {
        console.log(`✅ ${pos.name}: Has photo (${pos.photo})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkOrgChartData();