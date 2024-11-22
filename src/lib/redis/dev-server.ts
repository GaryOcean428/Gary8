if (typeof window !== 'undefined') {
  throw new Error('This module is server-side only');
}

import { exec } from 'child_process';
import { promisify } from 'util';
import { isWSL, isWindows } from '../utils/platform';

const execAsync = promisify(exec);

export async function checkRedisServer(): Promise<boolean> {
  try {
    if (isWindows()) {
      // First try WSL redis-cli
      try {
        const { stdout } = await execAsync('wsl redis-cli ping');
        return stdout.trim() === 'PONG';
      } catch {
        // If WSL fails, try Windows native Redis if installed
        try {
          const { stdout } = await execAsync('redis-cli ping');
          return stdout.trim() === 'PONG';
        } catch {
          console.log('Redis not found. Please install Redis using WSL or Windows native Redis.');
          return false;
        }
      }
    } else {
      const { stdout } = await execAsync('redis-cli ping');
      return stdout.trim() === 'PONG';
    }
  } catch {
    return false;
  }
}

export async function startRedisServer(): Promise<boolean> {
  try {
    if (isWindows()) {
      // Try starting Redis through WSL first
      try {
        await execAsync('wsl sudo service redis-server start');
      } catch (wslError) {
        console.log('Failed to start Redis through WSL. Trying Windows native Redis...');
        try {
          // Try Windows native Redis if installed
          await execAsync('redis-server --service-start');
        } catch (winError) {
          throw new Error('Failed to start Redis on both WSL and Windows native.');
        }
      }
    } else {
      await execAsync('sudo service redis-server start');
    }
    
    // Wait for Redis to be ready
    let attempts = 0;
    while (attempts < 5) {
      if (await checkRedisServer()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Redis server failed to start after multiple attempts');
  } catch (error) {
    console.error('Failed to start Redis server:', error);
    return false;
  }
} 