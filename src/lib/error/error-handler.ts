import { AppError } from './app-error';
import { thoughtLogger } from '../utils/logger';
import { MonitoringService } from '../monitoring/monitoring-service';

export class ErrorHandler {
  private static monitoring = MonitoringService.getInstance();

  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.monitoring.trackOperation(context, operation);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          thoughtLogger.error(`${context} failed after ${maxRetries} attempts`, {
            error: lastError,
            attempts: attempt
          });
          throw this.wrapError(lastError, context);
        }

        await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
      }
    }

    throw lastError!; // TypeScript safety
  }

  private static wrapError(error: Error, context: string): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(
      `Error in ${context}: ${error.message}`,
      'OPERATION_ERROR',
      { originalError: error }
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Add specific Firebase error handling
  static handleFirebaseError(error: FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        // Handle permission errors
        break;
      case 'resource-exhausted':
        // Handle quota errors
        break;
      // ... other cases
    }
  }
}