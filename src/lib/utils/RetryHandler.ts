/**
 * RetryHandler - Implements advanced retry strategies with exponential backoff
 * Includes circuit breaker pattern to prevent repeated failures
 */
import { getNetworkStatus } from '../../core/supabase/supabase-client';

export class RetryHandler {
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private backoffFactor: number;
  private jitterFactor: number;
  
  // Circuit breaker properties
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private circuitOpen: boolean = false;
  private circuitResetTimeout: number;
  private networkStatusCheckInterval: number = 2000; // Check network every 2 seconds
  
  /**
   * Creates a new RetryHandler
   * @param options Configuration options
   */
  constructor(options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitterFactor?: number;
    circuitResetTimeout?: number;
  } = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 300;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
    this.jitterFactor = options.jitterFactor || 0.1;
    this.circuitResetTimeout = options.circuitResetTimeout || 30000;
  }
  
  /**
   * Execute a function with retry logic
   * @param fn The function to execute
   * @returns Promise resolving to the function result
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open, too many recent failures');
    }
    
    // Check network status before attempting
    if (!getNetworkStatus()) {
      throw new Error('Network unavailable. Please check your internet connection and try again.');
    }
    
    let lastError: Error | undefined;
    let networkWasDisconnected = false;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // First attempt (attempt = 0) or retry attempts
        if (attempt > 0) {
          await this.delay(attempt);
          
          // Wait for network to come back if it went down
          if (networkWasDisconnected) {
            await this.waitForNetwork();
            networkWasDisconnected = false;
          }
          
          // Check network status again before retry
          if (!getNetworkStatus()) {
            networkWasDisconnected = true;
            throw new Error('Network connection lost during retry. Please check your internet connection.');
          }
        }
        
        const result = await fn();
        
        // Success - reset failure count
        if (attempt > 0) {
          this.resetFailures();
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.registerFailure();
        
        // Check for network errors specifically
        if (this.isNetworkError(error)) {
          // Update our flag to indicate we need to wait for network
          networkWasDisconnected = true;
          
          // Don't retry network errors immediately if we're offline
          if (!getNetworkStatus()) {
            // Wait for network to be back before retrying
            await this.waitForNetwork(10000); // Wait up to 10 seconds for network
            if (!getNetworkStatus()) {
              throw new Error('Network error. Please check your internet connection and try again.');
            }
          }
        }
        
        // Specific error types that should not be retried
        if (this.shouldNotRetry(error)) {
          throw error;
        }
        
        // Last attempt failed
        if (attempt === this.maxRetries) {
          throw error;
        }
      }
    }
    
    // This should never happen due to the above checks,
    // but TypeScript requires a return or throw here
    throw lastError || new Error('Retry failed');
  }
  
  /**
   * Calculates the delay for a retry attempt with exponential backoff
   * @param attempt Current attempt number (1-based)
   * @returns Promise that resolves after the calculated delay
   */
  private async delay(attempt: number): Promise<void> {
    // Calculate exponential backoff
    const expBackoff = this.initialDelay * Math.pow(this.backoffFactor, attempt - 1);
    const maxBackoff = Math.min(expBackoff, this.maxDelay);
    
    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * this.jitterFactor * 2 - this.jitterFactor;
    const finalDelay = Math.floor(maxBackoff * (1 + jitter));
    
    return new Promise(resolve => setTimeout(resolve, finalDelay));
  }
  
  /**
   * Register a failure for the circuit breaker
   */
  private registerFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // Open circuit if too many failures
    if (this.failures >= 5) {
      this.circuitOpen = true;
      
      // Schedule circuit reset
      setTimeout(() => {
        this.circuitOpen = false;
        this.failures = 0;
      }, this.circuitResetTimeout);
    }
  }
  
  /**
   * Resets the failure counter
   */
  private resetFailures(): void {
    this.failures = 0;
  }
  
  /**
   * Checks if the circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    // If circuit was marked open but reset timeout has passed, close it
    if (this.circuitOpen && Date.now() - this.lastFailureTime > this.circuitResetTimeout) {
      this.circuitOpen = false;
      this.failures = 0;
      return false;
    }
    
    return this.circuitOpen;
  }
  
  /**
   * Determines if an error is network-related
   * @param error The error to check
   * @returns True if the error is network-related
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const message = (error?.message || '').toLowerCase();
    return (
      error instanceof TypeError && 
      (message.includes('failed to fetch') || 
       message.includes('network') || 
       message.includes('connection')) ||
      error instanceof DOMException && error.name === 'AbortError' ||
      !getNetworkStatus()
    );
  }
  
  /**
   * Determines if an error should not be retried
   * @param error The error to check
   * @returns True if the error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry authorization errors, validation errors, etc.
    const message = (error?.message || '').toLowerCase();
    const code = error?.code || '';
    
    return (
      message.includes('unauthorized') ||
      message.includes('not found') ||
      message.includes('invalid') || 
      message.includes('validation') ||
      code === 'UNAUTHORIZED' ||
      code === 'FORBIDDEN' || 
      code === 'NOT_FOUND' || 
      code === 'VALIDATION_ERROR'
    );
  }
  
  /**
   * Waits for network connectivity to be restored
   * @param timeout Maximum time to wait (ms)
   * @returns Promise that resolves when network is available or timeout is reached
   */
  private async waitForNetwork(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (!getNetworkStatus()) {
      if (Date.now() - startTime > timeout) {
        break; // Break if timeout is reached
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, this.networkStatusCheckInterval));
    }
    
    // Final check
    if (!getNetworkStatus()) {
      throw new Error('Network connection not restored within timeout period.');
    }
  }
}