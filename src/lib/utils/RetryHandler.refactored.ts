/**
 * RetryHandler - Implements advanced retry strategies with exponential backoff
 * Includes circuit breaker pattern to prevent repeated failures
 */
import { getNetworkStatus, testSupabaseConnection } from '../../core/supabase/supabase-client';

// Status enum for more reliable circuit breaker
enum CircuitStatus {
  CLOSED,   // Normal operation, requests flow through
  HALF_OPEN, // Testing if service is back by allowing limited requests
  OPEN      // Circuit breaker has tripped, requests are blocked
}

export class RetryHandler {
  private readonly maxRetries: number;
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly backoffFactor: number;
  private readonly jitterFactor: number;
  
  // Circuit breaker properties
  private failures: number = 0;
  private consecutiveFailures: number = 0;
  private lastFailureTime: number = 0;
  /** 
   * Tracks the time of last successful operation for monitoring
   * Used in registerSuccess() for reliability metrics
   */
  private lastSuccessTime: number = Date.now();
  private circuitStatus: CircuitStatus = CircuitStatus.CLOSED;
  private readonly circuitResetTimeout: number;
  private readonly halfOpenMaxAttempts: number;
  private halfOpenAttempts: number = 0;
  private readonly serviceCheckInterval: number = 5000; // Check service every 5 seconds in half-open state
  private readonly networkStatusCheckInterval: number = 2000; // Check network every 2 seconds
  private isCheckingService: boolean = false;
  
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
    halfOpenMaxAttempts?: number;
  } = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 300;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
    this.jitterFactor = options.jitterFactor || 0.1;
    this.circuitResetTimeout = options.circuitResetTimeout || 30000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 3;
  }
  
  /**
   * Execute a function with retry logic
   * @param _fn The function to execute
   * @returns Promise resolving to the function result
   */
  async execute<T>(_fn: () => Promise<T>): Promise<T> {
    // Check circuit breaker and wait if necessary
    await this.handleCircuitBreaker();
    
    // Check network status before attempting
    await this.ensureNetworkConnectivity();
    
    return this.executeWithRetries(_fn);
  }

  /**
   * Performs the retry logic for the provided function
   * @param _fn The function to execute with retries
   * @returns The result of the function execution
   */
  private async executeWithRetries<T>(_fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let networkWasDisconnected = false;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Before retry attempts, apply delay and check network status
        if (attempt > 0) {
          await this.performRetryDelay(attempt);
          
          // Handle network reconnection if needed
          if (networkWasDisconnected) {
            await this.handleNetworkReconnection();
            networkWasDisconnected = false;
          }
        }
        
        const result = await _fn();
        
        // Success - reset failure count
        this.registerSuccess();
        
        return result;
      } catch (error) {
        // Process the error and determine if it's a network issue
        const { processedError, isNetworkIssue } = this.processError(error, attempt);
        lastError = processedError;
        
        // Update circuit breaker state
        this.registerFailure(isNetworkIssue);
        
        // Handle network errors specially
        if (isNetworkIssue) {
          networkWasDisconnected = true;
          await this.handleNetworkError();
        }
        
        // Check if we should stop retrying
        if (this.shouldNotRetry(error) || attempt === this.maxRetries) {
          throw this.createFinalError(lastError, isNetworkIssue, attempt);
        }
      }
    }
    
    // This should never happen due to the above checks,
    // but TypeScript requires a return or throw here
    throw lastError || new Error('Retry failed');
  }

  /**
   * Ensures network connectivity before proceeding
   */
  private async ensureNetworkConnectivity(): Promise<void> {
    if (!getNetworkStatus()) {
      console.warn('Network appears to be offline. Waiting for connectivity...');
      await this.waitForNetwork();
    }
  }

  /**
   * Handles the delay between retry attempts
   * @param attempt Current attempt number
   */
  private async performRetryDelay(attempt: number): Promise<void> {
    await this.delay(attempt);
    
    // Double-check network status right before retry
    if (!getNetworkStatus()) {
      throw new Error('Network connection lost during retry');
    }
  }

  /**
   * Handles the necessary operations after a network reconnection
   */
  private async handleNetworkReconnection(): Promise<void> {
    await this.waitForNetwork();
    
    // After network comes back, double-check service
    if (!(await this.quickServiceCheck())) {
      throw new Error('Service unavailable even though network is connected');
    }
  }

  /**
   * Processes an error and determines if it's network-related
   * @param error The error to process
   * @param attempt Current attempt number
   * @returns Processed error and network issue flag
   */
  private processError(error: unknown, attempt: number): { processedError: Error, isNetworkIssue: boolean } {
    const processedError = error instanceof Error ? error : new Error(String(error));
    const isNetworkIssue = this.isNetworkError(error);
    
    // Log helpful error for debugging
    console.warn(`RetryHandler: Attempt ${attempt + 1}/${this.maxRetries + 1} failed:`, 
      processedError.message, isNetworkIssue ? '(Network issue detected)' : '');
    
    return { processedError, isNetworkIssue };
  }

  /**
   * Handles network error situations
   */
  private async handleNetworkError(): Promise<void> {
    // Don't retry network errors immediately
    if (!getNetworkStatus()) {
      console.log('Network is offline. Waiting for connectivity before retry...');
      try {
        // Wait for network to be back before retrying
        await this.waitForNetwork(30000); // Wait up to 30 seconds for network
      } catch (_timeoutError) {
        console.warn('Network connection timeout:', _timeoutError);
        // No network after timeout - rethrow with more user-friendly message
        throw new Error('Network unavailable after timeout. Please check your internet connection.');
      }
    }
  }

  /**
   * Creates the final error to throw after all retries are exhausted
   * @param error The last error encountered
   * @param isNetworkIssue Whether the last error was network-related
   * @param attempt The last attempt number
   * @returns The final error to throw
   */
  private createFinalError(error: Error, isNetworkIssue: boolean, attempt: number): Error {
    if (isNetworkIssue) {
      return new Error(`Request failed after ${attempt + 1} attempts due to network issues. Please check your connection.`);
    } else {
      return error;
    }
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
   * Register a failure for the circuit breaker and update circuit status accordingly
   * @param isNetworkError Whether the failure was due to a network issue
   */
  private registerFailure(isNetworkError: boolean = false): void {
    this.failures++;
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    
    // Less consecutive failures needed to trip circuit if it's not a network issue
    // (i.e., server might be down, which is more serious than just network glitches)
    const failureThreshold = isNetworkError ? 5 : 3; 
    
    switch (this.circuitStatus) {
      case CircuitStatus.CLOSED:
        this.handleClosedCircuitFailure(failureThreshold);
        break;
        
      case CircuitStatus.HALF_OPEN:
        this.handleHalfOpenCircuitFailure();
        break;
    }
  }
  
  /**
   * Handle failure when circuit is closed
   * @param failureThreshold Number of failures needed to trip circuit
   */
  private handleClosedCircuitFailure(failureThreshold: number): void {
    // Trip circuit if too many consecutive failures
    if (this.consecutiveFailures >= failureThreshold) {
      console.warn(`RetryHandler: Circuit breaker tripped after ${this.consecutiveFailures} consecutive failures`);
      this.circuitStatus = CircuitStatus.OPEN;
      // Schedule transition to half-open state
      this.scheduleHalfOpenTransition();
    }
  }
  
  /**
   * Handle failure when circuit is half-open
   */
  private handleHalfOpenCircuitFailure(): void {
    // If failure in half-open state, go back to open
    console.warn('RetryHandler: Service still experiencing issues, circuit re-opened');
    this.circuitStatus = CircuitStatus.OPEN;
    // Reset timeout for next half-open attempt
    this.scheduleHalfOpenTransition();
  }
  
  /**
   * Schedule a transition to half-open state
   */
  private scheduleHalfOpenTransition(): void {
    setTimeout(() => {
      if (this.circuitStatus === CircuitStatus.OPEN) {
        console.log('RetryHandler: Circuit transitioning to half-open state');
        this.circuitStatus = CircuitStatus.HALF_OPEN;
        this.halfOpenAttempts = 0;
        this.startServiceChecking();
      }
    }, this.circuitResetTimeout);
  }
  
  /**
   * Register a successful operation and update circuit status
   */
  private registerSuccess(): void {
    this.consecutiveFailures = 0;
    // Track last success time for monitoring/debugging purposes
    this.lastSuccessTime = Date.now();
    
    // Calculate uptime duration since last failure, useful for reliability metrics
    const uptimeSinceFailure = this.lastFailureTime > 0 
      ? `${((Date.now() - this.lastFailureTime) / 1000).toFixed(1)}s` 
      : 'N/A';
    
    if (this.circuitStatus === CircuitStatus.HALF_OPEN) {
      this.halfOpenAttempts++;
      
      // If we've had enough successful attempts in half-open state, close the circuit
      if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        console.log(`RetryHandler: Service recovered, circuit closed (uptime: ${uptimeSinceFailure})`);
        this.circuitStatus = CircuitStatus.CLOSED;
        this.failures = 0;
        this.stopServiceChecking();
      }
    }
  }
  
  /**
   * Handle circuit breaker logic and wait if necessary
   */
  private async handleCircuitBreaker(): Promise<void> {
    switch (this.circuitStatus) {
      case CircuitStatus.OPEN:
        await this.handleOpenCircuit();
        break;
        
      case CircuitStatus.HALF_OPEN:
        this.handleHalfOpenCircuit();
        break;
    }
  }
  
  /**
   * Handle open circuit state
   */
  private async handleOpenCircuit(): Promise<void> {
    // If it's been long enough since the circuit opened, manually check if the service is back
    if (Date.now() - this.lastFailureTime > this.circuitResetTimeout) {
      await this.attemptCircuitRecovery();
    } else {
      // Circuit still open and not ready to try again
      throw new Error('Circuit breaker is open due to too many failures. Please try again in a few moments.');
    }
  }
  
  /**
   * Attempt to recover from open circuit
   */
  private async attemptCircuitRecovery(): Promise<void> {
    console.log('RetryHandler: Circuit reset timeout elapsed, checking service availability');
    this.circuitStatus = CircuitStatus.HALF_OPEN;
    this.halfOpenAttempts = 0;
    this.startServiceChecking();
    
    // Quick check if service is back
    const serviceAvailable = await this.quickServiceCheck();
    if (!serviceAvailable) {
      console.warn('RetryHandler: Service still unavailable');
      this.circuitStatus = CircuitStatus.OPEN;
      throw new Error('Service unavailable. Circuit breaker is open, please try again later.');
    }
  }
  
  /**
   * Handle half-open circuit state
   */
  private handleHalfOpenCircuit(): void {
    // In half-open state, we'll allow limited traffic through
    // but if we've reached the limit, we should reject until we know if those requests succeed
    if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
      throw new Error('Circuit breaker is in recovery mode. Please try again in a few moments.');
    }
  }
  
  /**
   * Performs a quick check to see if the service is available
   * @returns Promise<boolean> True if service appears to be available
   */
  private async quickServiceCheck(): Promise<boolean> {
    // Use Supabase connection test as a canary to check if services are available
    try {
      // First check if network is available
      if (!getNetworkStatus()) {
        return false;
      }
      
      // Then check if service is available
      return await testSupabaseConnection();
    } catch (error) {
      console.error('Error during service check:', error);
      return false;
    }
  }
  
  /**
   * Starts periodic service checking to transition from half-open to closed state
   */
  private startServiceChecking(): void {
    if (this.isCheckingService) return;
    
    this.isCheckingService = true;
    this.performServiceCheck();
  }
  
  /**
   * Performs a single service check and schedules the next one if needed
   */
  private async performServiceCheck(): Promise<void> {
    if (this.circuitStatus !== CircuitStatus.HALF_OPEN) {
      this.isCheckingService = false;
      return;
    }
    
    const serviceAvailable = await this.quickServiceCheck();
    
    if (serviceAvailable) {
      await this.handleServiceAvailable();
    } else {
      await this.handleServiceUnavailable();
      return;
    }
    
    // Schedule next check
    setTimeout(() => this.performServiceCheck(), this.serviceCheckInterval);
  }
  
  /**
   * Handle the case when service is available during check
   */
  private async handleServiceAvailable(): Promise<void> {
    console.log('RetryHandler: Service appears to be available again');
    this.halfOpenAttempts++;
    
    // If we've had enough successful checks, close the circuit
    if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
      console.log('RetryHandler: Service recovered, circuit closed');
      this.circuitStatus = CircuitStatus.CLOSED;
      this.failures = 0;
      this.isCheckingService = false;
    }
  }
  
  /**
   * Handle the case when service is unavailable during check
   */
  private async handleServiceUnavailable(): Promise<void> {
    console.warn('RetryHandler: Service still unavailable in half-open state');
    // If service is still unavailable, go back to open state
    this.circuitStatus = CircuitStatus.OPEN;
    
    // Schedule transition back to half-open
    setTimeout(() => {
      if (this.circuitStatus === CircuitStatus.OPEN) {
        console.log('RetryHandler: Circuit transitioning to half-open state');
        this.circuitStatus = CircuitStatus.HALF_OPEN;
        this.halfOpenAttempts = 0;
      }
    }, this.circuitResetTimeout);
    
    this.isCheckingService = false;
  }
  
  /**
   * Stops periodic service checking
   */
  private stopServiceChecking(): void {
    this.isCheckingService = false;
  }
  
  /**
   * Determines if an error is network-related by checking common network error patterns
   * @param _error The error to check
   * @returns True if the error is network-related
   */
  private isNetworkError(_error: unknown): boolean {
    // No error provided
    if (!_error) return false;
    
    // Direct network status check - most reliable indicator
    if (!getNetworkStatus()) return true;
    
    // Only proceed with error pattern analysis if we have an Error object
    if (!(_error instanceof Error)) return false;
    
    const message = _error.message.toLowerCase();
    
    // TypeErrors are often network-related in fetch operations
    if (_error instanceof TypeError) {
      if (message.includes('failed to fetch') || 
          message.includes('network') || 
          message.includes('connection')) {
        return true;
      }
    }
    
    // Timeout-related errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return true;
    }
    
    // Abort errors from fetch API
    if (_error instanceof DOMException && _error.name === 'AbortError') {
      return true;
    }
    
    // Common network error message patterns
    return message.includes('network error') ||
           message.includes('network request failed') ||
           message.includes('internet') ||
           message.includes('offline') ||
           message.includes('cors') ||
           message.includes('socket');
  }
  
  /**
   * Determines if an error should not be retried
   * @param _error The error to check
   * @returns True if the error should not be retried
   */
  private shouldNotRetry(_error: unknown): boolean {
    // Non-existent errors or non-error objects should not be retried
    if (!_error || !(_error instanceof Error)) return true;
    
    // Extract error details
    const message = _error.message.toLowerCase();
    const name = _error.name;
    
    // @ts-expect-error - Custom error fields
    const code = _error.code || _error.status || '';
    // @ts-expect-error - Custom error fields
    const statusCode = _error.statusCode || _error.status || 0;
    
    // Don't retry 4xx HTTP errors (except 408 Request Timeout, 429 Too Many Requests)
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      if (statusCode === 408 || statusCode === 429) {
        // These are retryable
        return false;
      }
      return true;
    }
    
    return this.isAuthError(message, code) || 
           this.isNotFoundError(message, code) || 
           this.isValidationError(message, code, name) || 
           this.isBusinessRuleViolation(message, code);
  }
  
  /**
   * Check if the error is an authentication or authorization error
   */
  private isAuthError(message: string, code: string): boolean {
    return message.includes('unauthorized') ||
           message.includes('unauthenticated') ||
           message.includes('authentication failed') ||
           (message.includes('auth') && message.includes('fail')) ||
           message.includes('forbidden') ||
           code === 'UNAUTHORIZED' ||
           code === 'UNAUTHENTICATED' ||
           code === 'FORBIDDEN';
  }
  
  /**
   * Check if the error is a not found error
   */
  private isNotFoundError(message: string, code: string): boolean {
    return message.includes('not found') ||
           message.includes('404') ||
           code === 'NOT_FOUND';
  }
  
  /**
   * Check if the error is a validation error
   */
  private isValidationError(message: string, code: string, name: string): boolean {
    return message.includes('invalid') || 
           message.includes('validation') ||
           message.includes('bad request') ||
           (message.includes('schema') && message.includes('error')) ||
           message.includes('constraint') ||
           code === 'VALIDATION_ERROR' ||
           code === 'BAD_REQUEST' ||
           name === 'ValidationError' ||
           name === 'SyntaxError'; // JSON parse errors, etc.
  }
  
  /**
   * Check if the error is a business rule violation
   */
  private isBusinessRuleViolation(message: string, code: string): boolean {
    return message.includes('conflict') ||
           message.includes('already exists') ||
           message.includes('duplicate') ||
           code === 'CONFLICT';
  }
  
  /**
   * Waits for network connectivity to be restored
   * @param _timeout Maximum time to wait (ms)
   * @returns Promise that resolves when network is available or rejects if timeout is reached
   */
  private async waitForNetwork(_timeout: number = 60000): Promise<void> {
    const startTime = Date.now();
    let hasLoggedWaiting = false;
    
    while (!getNetworkStatus()) {
      if (this.isNetworkTimeout(startTime, _timeout)) {
        throw new Error('Network connection not restored within timeout period.');
      }
      
      // Log only once to avoid console spam
      if (!hasLoggedWaiting) {
        console.log('RetryHandler: Waiting for network connectivity...');
        hasLoggedWaiting = true;
      }
      
      // Try direct service check after waiting for a while
      if (this.shouldAttemptDirectServiceCheck(startTime)) {
        const isServiceUp = await this.attemptServiceCheckDuringWait();
        if (isServiceUp) {
          return;
        }
      }
      
      // Wait before checking again
      await this.waitBeforeNextNetworkCheck();
    }
    
    await this.handleNetworkRestored(hasLoggedWaiting);
  }
  
  /**
   * Check if the network timeout has been reached
   */
  private isNetworkTimeout(startTime: number, timeout: number): boolean {
    return Date.now() - startTime > timeout;
  }
  
  /**
   * Determine if we should attempt a direct service check
   */
  private shouldAttemptDirectServiceCheck(startTime: number): boolean {
    return Date.now() - startTime > 10000; // After 10 seconds, try direct check
  }
  
  /**
   * Attempt a service check during network wait
   */
  private async attemptServiceCheckDuringWait(): Promise<boolean> {
    try {
      const isServiceUp = await this.quickServiceCheck();
      if (isServiceUp) {
        console.log('RetryHandler: Service is reachable despite network status indicators');
        return true;
      }
    } catch (_checkError) {
      // Ignore errors in service check during wait - expected during network outages
      console.debug('RetryHandler: Service check failed during network wait', _checkError);
    }
    return false;
  }
  
  /**
   * Wait before checking network again
   */
  private async waitBeforeNextNetworkCheck(): Promise<void> {
    await new Promise(_resolve => setTimeout(_resolve, this.networkStatusCheckInterval));
  }
  
  /**
   * Handle the case when network is restored
   */
  private async handleNetworkRestored(hasLoggedWaiting: boolean): Promise<void> {
    if (hasLoggedWaiting) {
      console.log('RetryHandler: Network connectivity restored');
    }
    
    // Give a brief delay to ensure network is stable
    await new Promise(_resolve => setTimeout(_resolve, 500));
    
    // Final service check to ensure API is actually available
    await this.performFinalServiceCheck();
  }
  
  /**
   * Perform a final service check after network is restored
   */
  private async performFinalServiceCheck(): Promise<void> {
    try {
      const isServiceUp = await this.quickServiceCheck();
      if (!isServiceUp) {
        console.warn('RetryHandler: Network is connected but service is unavailable');
      } else {
        console.log('RetryHandler: Service is reachable and ready');
      }
    } catch (_serviceError) {
      // Log service check errors but don't fail - we've already verified network is back
      console.warn('RetryHandler: Error checking service availability:', _serviceError);
    }
  }
}
