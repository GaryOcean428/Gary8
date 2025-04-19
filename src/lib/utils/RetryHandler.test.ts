import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RetryHandler } from './RetryHandler';
import { getNetworkStatus } from '../../core/supabase/supabase-client';

// Mock dependencies
vi.mock('../../core/supabase/supabase-client', () => ({
  getNetworkStatus: vi.fn().mockReturnValue(true),
  testSupabaseConnection: vi.fn().mockResolvedValue(true)
}));

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;
  
  // Clean up timers between tests
  beforeEach(() => {
    vi.useFakeTimers();
    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      circuitResetTimeout: 2000
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  
  it('should successfully execute a function without retries', async () => {
    const mockFunction = vi.fn().mockResolvedValue('Success');
    
    const result = await retryHandler.execute(mockFunction);
    
    expect(result).toBe('Success');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
  
  it('should retry a failing function up to maxRetries times', async () => {
    const mockFunction = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockRejectedValueOnce(new Error('Fail 3'))
      .mockResolvedValueOnce('Success');
    
    const result = await retryHandler.execute(mockFunction);
    
    expect(mockFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
    expect(result).toBe('Success');
  });
  
  it('should throw the last error after maxRetries failures', async () => {
    const mockFunction = vi.fn().mockRejectedValue(new Error('Persistent error'));
    
    await expect(retryHandler.execute(mockFunction)).rejects.toThrow('Persistent error');
    expect(mockFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });
  
  it('should use exponential backoff with jitter for retries', async () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5); // Fix jitter calculation
    
    const mockFunction = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('Success');
    
    const executePromise = retryHandler.execute(mockFunction);
    
    // First attempt fails immediately
    expect(mockFunction).toHaveBeenCalledTimes(1);
    
    // Advance past the first retry delay (100ms + jitter)
    await vi.advanceTimersByTimeAsync(105);
    expect(mockFunction).toHaveBeenCalledTimes(2);
    
    // Advance past the second retry delay (200ms + jitter)
    await vi.advanceTimersByTimeAsync(210);
    expect(mockFunction).toHaveBeenCalledTimes(3);
    
    // Verify final result
    const result = await executePromise;
    expect(result).toBe('Success');
  });
  
  it('should open circuit after consecutive failures', async () => {
    // Configure for faster testing
    retryHandler = new RetryHandler({
      maxRetries: 1, 
      initialDelay: 50,
      circuitResetTimeout: 1000
    });
    
    // Create a mock function that always fails
    const mockFunction = vi.fn().mockRejectedValue(new Error('Service error'));
    
    // Spy on console.warn to check for circuit breaker messages
    const warnSpy = vi.spyOn(console, 'warn');
    
    // First execution - should attempt initial call + 1 retry
    await expect(retryHandler.execute(mockFunction)).rejects.toThrow('Service error');
    expect(mockFunction).toHaveBeenCalledTimes(2); // Initial + 1 retry
    
    // Second execution - should attempt initial call + 1 retry
    mockFunction.mockClear();
    await expect(retryHandler.execute(mockFunction)).rejects.toThrow('Service error');
    expect(mockFunction).toHaveBeenCalledTimes(2); // Initial + 1 retry
    
    // Third execution - should attempt initial call + 1 retry
    mockFunction.mockClear();
    await expect(retryHandler.execute(mockFunction)).rejects.toThrow('Service error');
    expect(mockFunction).toHaveBeenCalledTimes(2); // Initial + 1 retry
    
    // At this point, the circuit should be open (tripped)
    mockFunction.mockClear();
    await expect(retryHandler.execute(mockFunction)).rejects.toThrow('Circuit breaker is open');
    expect(mockFunction).toHaveBeenCalledTimes(0); // No calls when circuit is open
    
    // Verify that the circuit breaker tripped message was logged
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Circuit breaker tripped'),
      expect.anything()
    );
  });
  
  it('should handle network errors differently from other errors', async () => {
    // Mock network status to be offline
    vi.mocked(getNetworkStatus).mockReturnValue(false);
    
    // Create a function that succeeds once network is back
    const mockFunction = vi.fn().mockResolvedValue('Success after network restored');
    
    // Start the execution - should wait for network
    const executePromise = retryHandler.execute(mockFunction);
    
    // Function shouldn't be called yet due to offline status
    expect(mockFunction).toHaveBeenCalledTimes(0);
    
    // Simulate network coming back after some time
    vi.mocked(getNetworkStatus).mockReturnValue(true);
    await vi.advanceTimersByTimeAsync(2100); // Wait for network check interval
    
    // Complete the execution and verify
    const result = await executePromise;
    expect(result).toBe('Success after network restored');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
  
  it('should transition from open to half-open to closed after recovery', async () => {
    const logSpy = vi.spyOn(console, 'log');
    
    // Configure for faster testing
    retryHandler = new RetryHandler({
      maxRetries: 1,
      initialDelay: 50,
      circuitResetTimeout: 1000,
      halfOpenMaxAttempts: 2
    });
    
    // Mock function that fails enough to open the circuit
    const mockFunction = vi.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'));
    
    // Execute until circuit opens - errors are expected in this phase
    for (let attempt = 0; attempt < 3; attempt++) {
      try { 
        await retryHandler.execute(mockFunction); 
      } catch (_expectedError) { 
        // Expected error, continue test circuit opening process 
        console.log(`Circuit opening attempt ${attempt+1}: Error expected and handled`);
      }
    }
    
    // Circuit should now be open
    await expect(retryHandler.execute(mockFunction)).rejects.toThrow('Circuit breaker is open');
    
    // Reset the mock to make it succeed for recovery testing
    mockFunction.mockReset();
    mockFunction.mockResolvedValue('Success');
    
    // Advance time so circuit timeout expires
    await vi.advanceTimersByTimeAsync(1100);
    
    // First success in half-open state
    const result1 = await retryHandler.execute(mockFunction);
    expect(result1).toBe('Success');
    
    // Second success in half-open state - should close the circuit
    const result2 = await retryHandler.execute(mockFunction);
    expect(result2).toBe('Success');
    
    // Verify that the circuit closed message was logged
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Service recovered, circuit closed')
    );
    
    // Verify circuit is fully operational again
    const result3 = await retryHandler.execute(mockFunction);
    expect(result3).toBe('Success');
  });
});
