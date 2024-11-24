import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { useToast } from '../../hooks/useToast';

export class ErrorHandler {
  static handleWithToast(error: unknown): void {
    console.error('Error:', error);
    
    const message = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';

    useToast.getState().addToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 5000
    });
  }

  static handleWithThrow(error: unknown, operation: string): never {
    thoughtLogger.log('error', `Failed to ${operation}`, { error });
    
    throw error instanceof AppError 
      ? error 
      : new AppError(
          `Failed to ${operation}`,
          'OPERATION_ERROR',
          error
        );
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    options: {
      errorMessage?: string;
      showToast?: boolean;
      throwError?: boolean;
    } = {}
  ): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      if (options.showToast) {
        this.handleWithToast(error);
      }
      if (options.throwError) {
        this.handleWithThrow(error, options.errorMessage || 'execute operation');
      }
      return null;
    }
  }
}
