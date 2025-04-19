/**
 * RetryHandler - Implements advanced retry strategies with exponential backoff
 * Includes circuit breaker pattern to prevent repeated failures
 */
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
   * @param _fn The function to execute
   * @returns Promise resolving to the function result
   */
  async execute<T>(_fn: () => Promise<T>): Promise<T> {
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open, too many recent failures');
    }
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // First attempt (attempt = 0) or retry attempts
        if (attempt > 0) {
          await this.delay(attempt);
        }
        
        const result = await _fn();
        
        // Success - reset failure count
        if (attempt > 0) {
          this.resetFailures();
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.registerFailure();
        
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
   * @param _attempt Current attempt number (1-based)
   * @returns Promise that resolves after the calculated delay
   */
  private async delay(_attempt: number): Promise<void> {
    // Calculate exponential backoff
    const expBackoff = this.initialDelay * Math.pow(this.backoffFactor, _attempt - 1);
    const maxBackoff = Math.min(expBackoff, this.maxDelay);
    
    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * this.jitterFactor * 2 - this.jitterFactor;
    const finalDelay = Math.floor(maxBackoff * (1 + jitter));
    
    return new Promise(_resolve => setTimeout(_resolve, finalDelay));
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
   * Determines if an error should not be retried
   * @param _error The error to check
   * @returns True if the error should not be retried
   */
  private shouldNotRetry(_error: unknown): boolean {
    // Don't retry authorization errors, validation errors, etc.
    const message = (_error?.message || '').toLowerCase();
    const code = _error?.code || '';
    
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
}