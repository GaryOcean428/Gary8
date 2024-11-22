import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { thoughtLogger } from '../lib/logging/thought-logger';

// Mock environment variables
vi.mock('../lib/config', () => ({
    config: {
        apiKeys: {
            github: 'test-token',
            perplexity: 'test-perplexity-key',
            anthropic: 'test-anthropic-key',
            groq: 'test-groq-key',
            pinecone: 'test-pinecone-key'
        },
        services: {
            redis: {
                host: 'localhost',
                port: 6379,
                password: 'test-password'
            },
            firebase: {
                projectId: 'test-project',
                apiKey: 'test-api-key'
            }
        }
    }
}));

// Mock thoughtLogger
vi.mock('../lib/logging/thought-logger', () => ({
    thoughtLogger: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
}));

// Mock Redis client
vi.mock('ioredis', () => ({
    default: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        get: vi.fn(),
        set: vi.fn()
    }))
}));

// Add global test utilities
global.setupTestEnvironment = async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset thoughtLogger
    thoughtLogger.log.mockClear();
    
    // Add other test setup as needed
};

// Add custom matchers
expect.extend({
    toBeWithinRange(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        return {
            pass,
            message: () => `expected ${received} to be within range ${floor} - ${ceiling}`
        };
    }
});
