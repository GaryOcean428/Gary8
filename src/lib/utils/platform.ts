const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

function isWindows() {
  return process.platform === 'win32';
}

async function isWSL() {
  try {
    const { stdout } = await execAsync('wsl echo "WSL check"');
    return stdout.includes('WSL check');
  } catch {
    return false;
  }
}

module.exports = {
  isWindows,
  isWSL
}; 