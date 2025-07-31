#!/usr/bin/env node

/**
 * Debug script to check news data on Heroku
 * Run this with: heroku run node debug-heroku-news.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to database
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 Connection string prefix:', mongoUri.substring(0, 20) + '...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Check news data
async function checkNewsData() {
  try {
    const News = require('./models/News');
    
    console.log('\n📰 === NEWS DATA ANALYSIS ===');
    
    // Get all news
    const allNews = await News.find({});
    console.log(`📊 Total news articles: ${allNews.length}`);
    
    if (allNews.length === 0) {
      console.log('❌ No news articles found in database!');
      console.log('💡 This means the database is empty or news collection doesn\'t exist');
      return;
    }
    
    // Group by status
    const byStatus = await News.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📈 News by Status:');
    byStatus.forEach(item => {
      console.log(`   ${item._id}: ${item.count} articles`);
    });
    
    // Get published news (what homepage shows)
    const publishedNews = await News.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10);
    
    console.log(`\n✅ Published news (shown on homepage): ${publishedNews.length}`);
    
    if (publishedNews.length > 0) {
      console.log('\n📝 Latest Published Articles:');
      publishedNews.forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}" (${article.publishedAt || article.createdAt})`);
      });
    } else {
      console.log('❌ No published news found! This is why homepage is empty.');
      
      // Check if there are draft articles that could be published
      const draftNews = await News.find({ status: 'draft' });
      if (draftNews.length > 0) {
        console.log(`\n💡 Found ${draftNews.length} draft articles that could be published:`);
        draftNews.forEach((article, index) => {
          console.log(`   ${index + 1}. "${article.title}" (Status: ${article.status})`);
        });
      }
    }
    
    // Test API endpoint functionality
    console.log('\n🧪 Testing getLatestNews function...');
    const DatabaseService = require('./services/databaseService');
    const latestNews = await DatabaseService.getLatestNews(5);
    console.log(`📡 API would return: ${latestNews.length} articles`);
    
    if (latestNews.length > 0) {
      console.log('✅ API is working correctly');
    } else {
      console.log('❌ API returns empty - no published articles');
    }
    
  } catch (error) {
    console.error('❌ Error checking news data:', error.message);
  }
}

// Auto-fix function to publish draft articles
async function fixDraftArticles() {
  try {
    const News = require('./models/News');
    
    // Find draft articles
    const draftArticles = await News.find({ status: 'draft' });
    
    if (draftArticles.length === 0) {
      console.log('✅ No draft articles to fix');
      return;
    }
    
    console.log(`\n🔧 Found ${draftArticles.length} draft articles. Updating to published...`);
    
    // Update all draft articles to published
    const result = await News.updateMany(
      { status: 'draft' },
      { 
        $set: { 
          status: 'published',
          publishedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} articles to published status`);
    
  } catch (error) {
    console.error('❌ Error fixing draft articles:', error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Heroku News Debug Script');
  console.log('============================\n');
  
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  await checkNewsData();
  
  // Ask if user wants to auto-fix drafts
  const args = process.argv.slice(2);
  if (args.includes('--fix-drafts')) {
    console.log('\n🔧 Auto-fixing draft articles...');
    await fixDraftArticles();
    
    // Check again after fix
    console.log('\n🔍 Checking data after fix...');
    await checkNewsData();
  } else {
    console.log('\n💡 To automatically publish all draft articles, run:');
    console.log('   heroku run node debug-heroku-news.js --fix-drafts');
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Debug complete!');
}

main().catch(console.error);