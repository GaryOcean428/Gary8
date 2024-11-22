const { exec } = require('child_process');
const { promisify } = require('util');
const { isWindows } = require('../src/lib/utils/platform');

const execAsync = promisify(exec);

async function checkRedisInstallation() {
  if (isWindows()) {
    try {
      // Check WSL installation
      await execAsync('wsl --version');
      console.log('✅ WSL is installed');
      
      try {
        // Check Redis in WSL
        await execAsync('wsl redis-cli --version');
        console.log('✅ Redis is installed in WSL');
      } catch {
        console.log('❌ Redis is not installed in WSL');
        console.log('Installing Redis in WSL...');
        try {
          await execAsync('wsl sudo apt-get update && sudo apt-get install -y redis-server');
          console.log('✅ Redis installed successfully in WSL');
        } catch (error) {
          console.error('Failed to install Redis:', error);
          process.exit(1);
        }
      }
    } catch {
      console.error('❌ WSL is not installed. Please install WSL first:');
      console.log('1. Open PowerShell as Administrator');
      console.log('2. Run: wsl --install');
      console.log('3. Restart your computer');
      process.exit(1);
    }
  }
}

checkRedisInstallation(); 