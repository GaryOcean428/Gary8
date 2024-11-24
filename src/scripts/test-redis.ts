import { redisClient } from '../lib/redis/redis-client';
import { thoughtLogger } from '../lib/logging/thought-logger';

async function testRedisConnection() {
  try {
    thoughtLogger.log('info', 'Testing Redis connection...', {}, { source: 'redis-test' });
    
    // Test basic set/get
    await redisClient.set('test-key', 'Hello Redis!');
    const value = await redisClient.get('test-key');
    
    if (value === 'Hello Redis!') {
      thoughtLogger.log('success', 'Redis test successful', { value }, { source: 'redis-test' });
    } else {
      throw new Error('Redis value mismatch');
    }
    
    // Clean up
    await redisClient.del('test-key');
    
    process.exit(0);
  } catch (error) {
    thoughtLogger.log('error', 'Redis test failed', { error }, { source: 'redis-test' });
    process.exit(1);
  }
}

// Handle process termination
process.on('uncaughtException', (error) => {
  thoughtLogger.log('error', 'Uncaught exception', { error }, { source: 'redis-test' });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  thoughtLogger.log('error', 'Unhandled rejection', { error }, { source: 'redis-test' });
  process.exit(1);
});

// Run the test
testRedisConnection(); 