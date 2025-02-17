import { RedisOptions } from 'ioredis';

interface RedisConfig {
  local: RedisOptions;
  cloud: RedisOptions;
}

export const redisConfig: RedisConfig = {
  local: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS_ENABLED === 'true' ? {} : undefined,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    keepAlive: process.env.REDIS_KEEP_ALIVE === 'true',
    family: parseInt(process.env.REDIS_FAMILY || '4'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'gary8:dev:',
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',
  },
  cloud: {
    host: process.env.REDIS_CLOUD_HOST,
    port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
    password: process.env.REDIS_CLOUD_PASSWORD,
    tls: process.env.REDIS_CLOUD_TLS_ENABLED === 'true' ? {} : undefined,
    db: parseInt(process.env.REDIS_CLOUD_DATABASE || '0'),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    keepAlive: process.env.REDIS_KEEP_ALIVE === 'true',
    family: parseInt(process.env.REDIS_FAMILY || '4'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'gary8:dev:',
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',
  }
};

export const getRedisConfig = (useCloud: boolean = false): RedisOptions => {
  return useCloud ? redisConfig.cloud : redisConfig.local;
}; 
