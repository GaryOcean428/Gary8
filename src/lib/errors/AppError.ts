export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class APIError extends AppError {
  constructor(
    message: string, 
    public statusCode?: number, 
    public response?: any, 
    public details?: any
  ) {
    super(message, 'API_ERROR', details);
    this.name = 'APIError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class SearchError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'SEARCH_ERROR', details);
    this.name = 'SearchError';
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'PROCESSING_ERROR', details);
    this.name = 'ProcessingError';
  }
}

export class ToolError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'TOOL_ERROR', details);
    this.name = 'ToolError';
  }
}

export class MemoryError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'MEMORY_ERROR', details);
    this.name = 'MemoryError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}