import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../../lib/errors/AppError';
import { thoughtLogger } from '../../lib/logging/thought-logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isRetrying: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    thoughtLogger.log('error', `Uncaught error: ${error.message}`, {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReset = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Check if error is API key related
      if (this.state.error?.message.includes('API key')) {
        // Wait for potential env var updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.setState({ hasError: false, error: null, isRetrying: false });
    } catch (error) {
      this.setState({ isRetrying: false });
    }
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    
    if (!error) return 'An unknown error occurred';
    
    if (error instanceof AppError) {
      return error.message;
    }
    
    // Check for common error types
    if (error.name === 'ChunkLoadError' || error.message.includes('loading chunk')) {
      return 'Failed to load application code. Please refresh the page.';
    }
    
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'Network error detected. Please check your internet connection.';
    }
    
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return 'Authentication error. Please check your API keys in settings.';
    }
    
    return error.message;
  }

  public render() {
    if (this.state.hasError) {
      // Get error details
      const message = this.getErrorMessage();
      
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="card card-glass max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>
            
            <p className="text-foreground mb-4">{message}</p>
            
            <button
              onClick={this.handleReset}
              disabled={this.state.isRetrying}
              className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {this.state.isRetrying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                <span>Try again</span>
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}