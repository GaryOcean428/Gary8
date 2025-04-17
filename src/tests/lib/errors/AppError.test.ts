import { describe, it, expect } from 'vitest';
import { 
  AppError, 
  APIError, 
  NetworkError, 
  SearchError, 
  ToolError, 
  ConfigurationError 
} from '../../../lib/errors/AppError';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create a basic AppError', () => {
      const error = new AppError('Something went wrong');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.details).toBeUndefined();
      expect(error.name).toBe('AppError');
    });
    
    it('should create an AppError with custom code and details', () => {
      const details = { requestId: '123', endpoint: '/api/test' };
      const error = new AppError('API request failed', 'CUSTOM_ERROR', details);
      
      expect(error.message).toBe('API request failed');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual(details);
    });
  });
  
  describe('APIError', () => {
    it('should create a basic APIError', () => {
      const error = new APIError('Failed to call API');
      expect(error.message).toBe('Failed to call API');
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('APIError');
    });
    
    it('should create an APIError with statusCode and response', () => {
      const response = { error: 'Not found' };
      const error = new APIError('Entity not found', 404, response);
      
      expect(error.message).toBe('Entity not found');
      expect(error.statusCode).toBe(404);
      expect(error.response).toEqual(response);
      expect(error.code).toBe('API_ERROR');
    });
  });
  
  describe('NetworkError', () => {
    it('should create a NetworkError', () => {
      const error = new NetworkError('Connection timeout');
      expect(error.message).toBe('Connection timeout');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('NetworkError');
    });
  });
  
  describe('SearchError', () => {
    it('should create a SearchError', () => {
      const error = new SearchError('Invalid search query');
      expect(error.message).toBe('Invalid search query');
      expect(error.code).toBe('SEARCH_ERROR');
      expect(error.name).toBe('SearchError');
    });
  });
  
  describe('ToolError', () => {
    it('should create a ToolError', () => {
      const details = { toolName: 'csv-exporter' };
      const error = new ToolError('Failed to execute tool', details);
      
      expect(error.message).toBe('Failed to execute tool');
      expect(error.code).toBe('TOOL_ERROR');
      expect(error.details).toEqual(details);
      expect(error.name).toBe('ToolError');
    });
  });
  
  describe('ConfigurationError', () => {
    it('should create a ConfigurationError', () => {
      const error = new ConfigurationError('Missing required configuration');
      expect(error.message).toBe('Missing required configuration');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.name).toBe('ConfigurationError');
    });
  });
  
  describe('Error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const apiError = new APIError('API error');
      const networkError = new NetworkError('Network error');
      
      expect(apiError instanceof AppError).toBe(true);
      expect(apiError instanceof Error).toBe(true);
      
      expect(networkError instanceof AppError).toBe(true);
      expect(networkError instanceof Error).toBe(true);
    });
  });
});