// This module is only used by scripts, not the Next.js application
if (typeof window === 'undefined') {
  const { exec } = require('child_process');
  const { promisify } = require('util');

  const execAsync = promisify(exec);

  async function checkRedisServer() {
    try {
      // Check if Redis is running in WSL
      const { stdout } = await execAsync('wsl -e pgrep redis-server');
      return stdout.trim().length > 0;
    } catch (error) {
      // pgrep returns exit code 1 if no process is found
      return false;
    }
  }

  async function startRedisServer() {
    try {
      // Start Redis server in WSL
      await execAsync('wsl -e sudo service redis-server start');
      
      // Verify it started successfully
      const isRunning = await checkRedisServer();
      return isRunning;
    } catch (error) {
      console.error('Failed to start Redis server:', error);
      return false;
    }
  }

  module.exports = {
    checkRedisServer,
    startRedisServer
  };
} else {
  // Provide empty implementations for client-side
  module.exports = {
    checkRedisServer: async () => false,
    startRedisServer: async () => false
  };
}
