import type { RedisConfig, RedisClient, RedisCacheConfig, RedisServiceOptions, RedisValue, RedisError } from './types/redis';
import type { ThoughtType, Thought } from './types/thought-types';
import type { Settings } from './types/settings';

// Re-export Redis types
export type {
  RedisConfig,
  RedisClient,
  RedisCacheConfig,
  RedisServiceOptions,
  RedisValue,
  RedisError
};

// Re-export existing types
export type {
  ThoughtType,
  Thought,
  Settings
};

// Panel Types
export type ActivePanel = 'chat' | 'canvas' | 'documents' | 'settings' | 'tools';

// Pinecone Types
export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryOptions {
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
  includeValues?: boolean;
  includeMetadata?: boolean;
}

export interface PineconeResponse {
  matches: Array<{
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, any>;
  }>;
  namespace: string;
}

// System Configuration Types
export interface SystemConfig {
  redis: RedisCacheConfig;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destination: 'console' | 'file';
  };
  security: {
    rateLimiting: boolean;
    maxRequestsPerMinute: number;
    corsOrigins: string[];
  };
}

// Cache Types
export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage: number;
  uptime: number;
}

// Service Types
export interface ServiceStatus {
  healthy: boolean;
  message?: string;
  lastCheck: Date;
  metrics?: {
    latency: number;
    errorRate: number;
    requestCount: number;
  };
}

export interface SystemHealth {
  redis: ServiceStatus;
  api: ServiceStatus;
  database: ServiceStatus;
  cache: CacheStats;
}
