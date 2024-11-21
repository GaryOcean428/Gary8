import type { ProcessingError } from '../../types';

export class ErrorHandler {
  static createError(code: string, message: string, details?: any): ProcessingError {
    const error = new Error(message) as ProcessingError;
    error.code = code;
    error.details = details;
    return error;
  }

  static handleError(error: Error | ProcessingError): ProcessingError {
    if ((error as ProcessingError).code) {
      return error as ProcessingError;
    }

    return this.createError(
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred',
      { originalError: error }
    );
  }

  static isProcessingError(error: any): error is ProcessingError {
    return error && typeof error === 'object' && 'code' in error;
  }
}