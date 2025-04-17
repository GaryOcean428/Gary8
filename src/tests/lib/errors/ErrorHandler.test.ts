import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler } from '../../../lib/errors/ErrorHandler';
import { AppError, APIError } from '../../../lib/errors/AppError';
import { thoughtLogger } from '../../../lib/logging/thought-logger';

// Mock thoughtLogger
vi.mock('../../../lib/logging/thought-logger', () => ({
  thoughtLogger: {
    log: vi.fn()
  }
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('handle', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError('App error', 'CUSTOM_ERROR', { detail: 'test' });
      const result = ErrorHandler.handle(appError);
      
      expect(result).toEqual({ message: 'App error', details: { detail: 'test' } });
      expect(thoughtLogger.log).toHaveBeenCalledWith('error', 'App error', { detail: 'test' });
    });
    
    it('should handle APIError correctly', () => {
      const apiError = new APIError('API error', 404, { error: 'Not found' });
      const result = ErrorHandler.handle(apiError);
      
      expect(result).toEqual({
        message: 'API error',
        details: {
          statusCode: 404,
          response: { error: 'Not found' }
        }
      });
      expect(thoughtLogger.log).toHaveBeenCalledWith('error', 'API error', {
        statusCode: 404,
        response: { error: 'Not found' }
      });
    });
    
    it('should handle standard Error correctly', () => {
      const standardError = new Error('Standard error');
      standardError.stack = 'Error stack trace';
      const result = ErrorHandler.handle(standardError);
      
      expect(result).toEqual({
        message: 'Standard error',
        details: { stack: 'Error stack trace' }
      });
      expect(thoughtLogger.log).toHaveBeenCalledWith('error', 'Standard error', {
        stack: 'Error stack trace'
      });
    });
    
    it('should handle non-Error objects correctly', () => {
      const result = ErrorHandler.handle('String error');
      
      expect(result).toEqual({
        message: 'String error',
        details: undefined
      });
      expect(thoughtLogger.log).toHaveBeenCalledWith('error', 'String error', undefined);
    });
  });
  
  describe('handleAsync', () => {
    it('should return successful results', async () => {
      const promise = Promise.resolve('success');
      const [result, error] = await ErrorHandler.handleAsync(promise);
      
      expect(result).toBe('success');
      expect(error).toBe(null);
    });
    
    it('should handle errors properly', async () => {
      const promise = Promise.reject(new Error('Async error'));
      const [result, error] = await ErrorHandler.handleAsync(promise);
      
      expect(result).toBe(null);
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Async error');
    });
  });
  
  describe('createAPIError', () => {
    it('should create an APIError from Response', () => {
      const response = new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        statusText: 'Not Found'
      });
      
      const data = { message: 'Not found' };
      const error = ErrorHandler.createAPIError(response, data);
      
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });
    
    it('should handle missing data gracefully', () => {
      const response = new Response(null, {
        status: 500,
        statusText: 'Server Error'
      });
      
      const error = ErrorHandler.createAPIError(response);
      
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('500 Server Error');
      expect(error.statusCode).toBe(500);
    });
  });
  
  describe('utility functions', () => {
    it('should detect network errors correctly', () => {
      const fetchError = new TypeError('Failed to fetch');
      expect(ErrorHandler.isNetworkError(fetchError)).toBe(true);
      
      const regularError = new Error('Not a network error');
      expect(ErrorHandler.isNetworkError(regularError)).toBe(false);
    });
    
    it('should detect API errors correctly', () => {
      const apiError = new APIError('API error');
      expect(ErrorHandler.isAPIError(apiError)).toBe(true);
      
      const appError = new AppError('App error');
      expect(ErrorHandler.isAPIError(appError)).toBe(false);
    });
  });
});