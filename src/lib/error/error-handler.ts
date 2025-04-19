import type { ProcessingError } from '../../types';

export class ErrorHandler {
  static createError(_code: string, _message: string, _details?: unknown): ProcessingError {
    const error = new Error(_message) as ProcessingError;
    error.code = _code;
    error.details = _details;
    return error;
  }

  static handleError(_error: Error | ProcessingError): ProcessingError {
    if ((_error as ProcessingError).code) {
      return _error as ProcessingError;
    }

    return this.createError(
      'UNKNOWN_ERROR',
      _error.message || 'An unknown error occurred',
      { originalError: _error }
    );
  }

  static isProcessingError(_error: unknown): _error is ProcessingError {
    return _error && typeof _error === 'object' && 'code' in _error;
  }
}