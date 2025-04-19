import { AppError, APIError, NetworkError } from './AppError';
import { thoughtLogger } from '../logging/thought-logger';

export class ErrorHandler {
  static handle(_error: unknown): { message: string; details?: unknown } {
    let message: string;
    let details: any;

    if (_error instanceof APIError) {
      // Use the original message for API errors
      message = _error.message;
      // Include status code and response, and any additional details
      details = {
        statusCode: _error.statusCode,
        response: _error.response,
        ...(_error.details || {})
      };
    } else if (_error instanceof AppError) {
      message = _error.message;
      details = _error.details;
    } else if (_error instanceof Error) {
      message = _error.message;
      details = { stack: _error.stack };
    } else {
      message = String(_error);
    }

    thoughtLogger.log('error', message, details);
    return { message, details };
  }

  static async handleAsync<T>(
    _promise: Promise<T>
  ): Promise<[T | null, Error | null]> {
    try {
      const result = await _promise;
      return [result, null];
    } catch (error) {
      const handled = error instanceof Error ? error : new Error(String(error));
      return [null, handled];
    }
  }

  static createAPIError(_response: Response, _data?: unknown): APIError {
    const message = this.getErrorMessageFromResponse(_response, _data);
    return new APIError(message, _response.status, _response, _data);
  }

  private static getAPIErrorMessage(_error: APIError): string {
    if (_error.response) {
      return this.getErrorMessageFromResponse(_error.response, _error.details);
    }
    return _error.message || 'API request failed';
  }

  private static getErrorMessageFromResponse(_response: Response, _data?: unknown): string {
    if (_data?.message) {
      return _data.message;
    }
    if (_data?.error) {
      return typeof _data.error === 'string' ? _data.error : JSON.stringify(_data.error);
    }
    return `${_response.status} ${_response.statusText}`;
  }

  static isNetworkError(_error: unknown): boolean {
    const isFetchError = _error instanceof TypeError &&
      (_error as Error).message.includes('Failed to fetch');
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return isFetchError || isOffline;
  }

  static isAPIError(_error: unknown): _error is APIError {
    return _error instanceof APIError;
  }
}