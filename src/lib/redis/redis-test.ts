import { redisClient } from './redis-client';
import { thoughtLogger } from '../logging/thought-logger';

export async function testRedisConnection() {
  try {
    await redisClient.set('test', 'Hello Redis!');
    const value = await redisClient.get('test');
    thoughtLogger.log('success', 'Redis connection test successful', { value });
    return true;
  } catch (error) {
    thoughtLogger.log('error', 'Redis connection test failed', { error });
    return false;
  }
} 