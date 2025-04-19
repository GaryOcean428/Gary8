import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryHandler } from '../../lib/utils/RetryHandler';

// Mock getNetworkStatus function
vi.mock('../../core/supabase/supabase-client', () => ({
  getNetworkStatus: vi.fn(() => true),
}));

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;
  
  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 10, // Short delay for tests
      maxDelay: 100,
      backoffFactor: 2,
      circuitResetTimeout: 500
    });
    
    // Reset mocks
    vi.resetAllMocks();
  });
  
  it('should execute successfully when no errors occur', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await retryHandler.execute(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValue('success on attempt 3');
    
    const result = await retryHandler.execute(mockFn);
    
    expect(result).toBe('success on attempt 3');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
  
  it('should throw error after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(retryHandler.execute(mockFn)).rejects.toThrow('Always fails');
    expect(mockFn).toHaveBeenCalledTimes(4); // Initial attempt + 3 retries
  });
  
  it('should not retry on certain errors', async () => {
    // Create error with unauthorized message
    const unauthorizedError = new Error('unauthorized access');
    const mockFn = vi.fn().mockRejectedValue(unauthorizedError);
    
    await expect(retryHandler.execute(mockFn)).rejects.toThrow('unauthorized access');
    expect(mockFn).toHaveBeenCalledTimes(1); // Should not retry
  });
  
  it('should not retry when offline', async () => {
    // Mock network as offline
    const { getNetworkStatus } = require('../../core/supabase/supabase-client');
    getNetworkStatus.mockReturnValue(false);
    
    const mockFn = vi.fn().mockResolvedValue('success');
    
    await expect(retryHandler.execute(mockFn)).rejects.toThrow('Network unavailable');
    expect(mockFn).toHaveBeenCalledTimes(0); // Should not even attempt when offline
  });
  
  it('should handle circuit breaker pattern', async () => {
    // Setup to trip the circuit breaker
    const mockFn = vi.fn().mockRejectedValue(new Error('Server error'));
    
    // Make 5 calls to trip the circuit breaker
    for (let i = 0; i < 5; i++) {
      try {
        await retryHandler.execute(mockFn);
      } catch (e) {
        // Ignore errors
      }
    }
    
    // The circuit breaker should now be open
    const nextFn = vi.fn().mockResolvedValue('success');
    await expect(retryHandler.execute(nextFn)).rejects.toThrow('Circuit breaker is open');
    expect(nextFn).not.toHaveBeenCalled();
    
    // Wait for circuit breaker to reset
    await new Promise(_resolve => setTimeout(_resolve, 600));
    
    // Should work again
    const workingFn = vi.fn().mockResolvedValue('success after reset');
    const result = await retryHandler.execute(workingFn);
    expect(result).toBe('success after reset');
  });
});