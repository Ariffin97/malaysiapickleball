const { connectDB } = require('../config/database');
const Settings = require('../models/Settings');

async function showMongoDBStorage() {
  try {
    console.log('🔍 MongoDB Organization Chart Storage Analysis');
    console.log('=============================================\n');
    
    // Connect to MongoDB
    await connectDB();
    
    // Get the organization chart data from Settings collection
    const orgChartSetting = await Settings.findOne({ key: 'organization_chart_data' });
    
    if (!orgChartSetting) {
      console.log('❌ No organization chart data found in Settings collection');
      return;
    }
    
    console.log('📄 MongoDB Document Structure:');
    console.log('==============================');
    console.log('Collection: settings');
    console.log('Document ID:', orgChartSetting._id);
    console.log('Key:', orgChartSetting.key);
    console.log('Category:', orgChartSetting.category);
    console.log('Description:', orgChartSetting.description);
    console.log('Last Modified:', orgChartSetting.lastModified);
    console.log('Modified By:', orgChartSetting.modifiedBy);
    console.log('Created At:', orgChartSetting.createdAt);
    console.log('Updated At:', orgChartSetting.updatedAt);
    
    console.log('\n💾 Data Storage Details:');
    console.log('========================');
    console.log('Storage Method: JSON string in Settings.value field');
    console.log('Data Type: Mixed (allows any type including strings, objects, arrays)');
    console.log('Value Length:', orgChartSetting.value.length, 'characters');
    
    // Parse and analyze the actual data
    const orgChartData = JSON.parse(orgChartSetting.value);
    
    console.log('\n📊 Stored Organization Chart Data:');
    console.log('==================================');
    
    // Show structure summary
    console.log('Data Structure:');
    console.log('  - Advisors:', orgChartData.advisors?.length || 0);
    console.log('  - President:', orgChartData.president ? '✅' : '❌');
    console.log('  - Vice Presidents:', orgChartData.vicePresidents?.length || 0);
    console.log('  - Secretary:', orgChartData.secretary ? '✅' : '❌');
    console.log('  - Treasurer:', orgChartData.treasurer ? '✅' : '❌');
    console.log('  - Committees:', orgChartData.committees?.length || 0);
    
    console.log('\n🖼️ Image Storage Analysis:');
    console.log('==========================');
    
    // Count images stored
    let imageCount = 0;
    let nullCount = 0;
    
    // Check advisors
    if (orgChartData.advisors) {
      orgChartData.advisors.forEach((advisor, index) => {
        if (advisor.photo && advisor.photo !== null && advisor.photo !== 'null') {
          imageCount++;
          console.log(`✅ Advisor ${index + 1}: ${advisor.photo}`);
        } else {
          nullCount++;
          console.log(`❌ Advisor ${index + 1}: No image`);
        }
      });
    }
    
    // Check president
    if (orgChartData.president?.photo && orgChartData.president.photo !== null && orgChartData.president.photo !== 'null') {
      imageCount++;
      console.log(`✅ President: ${orgChartData.president.photo}`);
    } else {
      nullCount++;
      console.log(`❌ President: No image`);
    }
    
    // Check vice presidents
    if (orgChartData.vicePresidents) {
      orgChartData.vicePresidents.forEach((vp, index) => {
        if (vp.photo && vp.photo !== null && vp.photo !== 'null') {
          imageCount++;
          console.log(`✅ VP ${index + 1}: ${vp.photo}`);
        } else {
          nullCount++;
          console.log(`❌ VP ${index + 1}: No image`);
        }
      });
    }
    
    // Check secretary
    if (orgChartData.secretary?.photo && orgChartData.secretary.photo !== null && orgChartData.secretary.photo !== 'null') {
      imageCount++;
      console.log(`✅ Secretary: ${orgChartData.secretary.photo}`);
    } else {
      nullCount++;
      console.log(`❌ Secretary: No image`);
    }
    
    // Check treasurer
    if (orgChartData.treasurer?.photo && orgChartData.treasurer.photo !== null && orgChartData.treasurer.photo !== 'null') {
      imageCount++;
      console.log(`✅ Treasurer: ${orgChartData.treasurer.photo}`);
    } else {
      nullCount++;
      console.log(`❌ Treasurer: No image`);
    }
    
    // Check committees
    if (orgChartData.committees) {
      orgChartData.committees.forEach((committee, index) => {
        if (committee.photo && committee.photo !== null && committee.photo !== 'null') {
          imageCount++;
          console.log(`✅ ${committee.type} Committee: ${committee.photo}`);
        } else {
          nullCount++;
          console.log(`❌ ${committee.type} Committee: No image`);
        }
      });
    }
    
    console.log('\n📈 Storage Summary:');
    console.log('==================');
    console.log(`Total positions: ${imageCount + nullCount}`);
    console.log(`Positions with images: ${imageCount}`);
    console.log(`Positions without images: ${nullCount}`);
    console.log(`Success rate: ${((imageCount / (imageCount + nullCount)) * 100).toFixed(1)}%`);
    
    console.log('\n💡 How it works:');
    console.log('================');
    console.log('1. Form data is submitted from admin dashboard');
    console.log('2. Images are uploaded to /public/uploads/org_chart/');
    console.log('3. Image paths and all text data are combined into a JSON object');
    console.log('4. JSON object is converted to string and saved to MongoDB Settings collection');
    console.log('5. Data is retrieved by parsing the JSON string from database');
    console.log('6. Public pages display images using the stored file paths');
    
    console.log('\n🔧 Database Technical Details:');
    console.log('==============================');
    console.log('Database: malaysia-pickleball');
    console.log('Collection: settings');
    console.log('Document Field Structure:');
    console.log('  _id: ObjectId');
    console.log('  key: "organization_chart_data"');
    console.log('  value: JSON string containing all org chart data');
    console.log('  description: Text description');
    console.log('  category: "general"');
    console.log('  lastModified: Date');
    console.log('  modifiedBy: Admin username');
    console.log('  createdAt: Date');
    console.log('  updatedAt: Date');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

showMongoDBStorage();