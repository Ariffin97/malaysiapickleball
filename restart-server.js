// Quick restart script to test staging system
const { exec } = require('child_process');

console.log('🔄 Restarting server with staging system...');

// Kill existing server process if running
exec("pkill -f 'node server-new.js'", (error) => {
  if (error) {
    console.log('ℹ️  No existing server process found');
  } else {
    console.log('🛑 Stopped existing server');
  }
  
  // Wait a moment then start new server
  setTimeout(() => {
    console.log('🚀 Starting server with staging system...');
    
    const server = exec('node server-new.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Server error:', error);
        return;
      }
    });
    
    server.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    server.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
  }, 2000);
});