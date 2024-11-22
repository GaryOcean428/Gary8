import { Redis } from 'ioredis';
import { thoughtLogger } from '../logging/thought-logger.js';

interface RedisConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls?: {
    rejectUnauthorized: boolean;
  };
  retryStrategy?: (times: number) => number | void;
}

class MockRedisClient {
  private cache: Map<string, string>;

  constructor() {
    this.cache = new Map();
    thoughtLogger.log('info', 'Initialized mock Redis client for development', { source: 'redis' });
  }

  async get(key: string): Promise<string | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.cache.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }
}

const getRedisConfig = (): RedisConfig => {
  if (process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        thoughtLogger.log('info', `Retrying Redis connection in ${delay}ms`, { source: 'redis' });
        return delay;
      }
    };
  }

  return {
    host: '127.0.0.1',
    port: 6379,
    username: 'default',
    password: '',
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      thoughtLogger.log('info', `Retrying Redis connection in ${delay}ms`, { source: 'redis' });
      return delay;
    }
  };
};

const createRedisClient = () => {
  const config = getRedisConfig();

  try {
    const client = new Redis(config);
    
    client.on('error', (error) => {
      thoughtLogger.log('error', 'Redis connection error', { error, source: 'redis' });
      if (process.env.NODE_ENV !== 'production') {
        thoughtLogger.log('info', 'Falling back to mock Redis client', { source: 'redis' });
        return new MockRedisClient();
      }
    });

    client.on('connect', () => {
      thoughtLogger.log('success', `Connected to Redis at ${config.host}:${config.port}`, { source: 'redis' });
    });

    return client;
  } catch (error) {
    thoughtLogger.log('warning', 'Redis connection failed, using mock client', { error, source: 'redis' });
    return new MockRedisClient();
  }
};

export const redisClient = createRedisClient();
