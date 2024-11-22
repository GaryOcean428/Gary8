const path = require('path');
const { checkRedisServer, startRedisServer } = require(path.join(__dirname, '../src/lib/redis/dev-server'));

async function ensureRedisRunning() {
  try {
    const isRunning = await checkRedisServer();
    if (!isRunning) {
      console.log('🚀 Starting Redis server...');
      const started = await startRedisServer();
      if (!started) {
        console.error('❌ Failed to start Redis server');
        process.exit(1);
      }
      console.log('✅ Redis server started successfully');
    } else {
      console.log('✅ Redis server is already running');
    }
  } catch (error) {
    console.error('❌ Error checking Redis server:', error);
    process.exit(1);
  }
}

ensureRedisRunning(); 