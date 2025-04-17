import { AppError, APIError, NetworkError } from './AppError';
import { thoughtLogger } from '../logging/thought-logger';

export class ErrorHandler {
  static handle(error: unknown): { message: string; details?: any } {
    let message: string;
    let details: any;

    if (error instanceof APIError) {
      // Use the original message for API errors
      message = error.message;
      // Include status code and response, and any additional details
      details = {
        statusCode: error.statusCode,
        response: error.response,
        ...(error.details || {})
      };
    } else if (error instanceof AppError) {
      message = error.message;
      details = error.details;
    } else if (error instanceof Error) {
      message = error.message;
      details = { stack: error.stack };
    } else {
      message = String(error);
    }

    thoughtLogger.log('error', message, details);
    return { message, details };
  }

  static async handleAsync<T>(
    promise: Promise<T>
  ): Promise<[T | null, Error | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      const handled = error instanceof Error ? error : new Error(String(error));
      return [null, handled];
    }
  }

  static createAPIError(response: Response, data?: any): APIError {
    const message = this.getErrorMessageFromResponse(response, data);
    return new APIError(message, response.status, response, data);
  }

  private static getAPIErrorMessage(error: APIError): string {
    if (error.response) {
      return this.getErrorMessageFromResponse(error.response, error.details);
    }
    return error.message || 'API request failed';
  }

  private static getErrorMessageFromResponse(response: Response, data?: any): string {
    if (data?.message) {
      return data.message;
    }
    if (data?.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
    return `${response.status} ${response.statusText}`;
  }

  static isNetworkError(error: unknown): boolean {
    const isFetchError = error instanceof TypeError &&
      (error as Error).message.includes('Failed to fetch');
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return isFetchError || isOffline;
  }

  static isAPIError(error: unknown): error is APIError {
    return error instanceof APIError;
  }
}