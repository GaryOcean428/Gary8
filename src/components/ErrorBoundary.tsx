import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler } from '../lib/errors/ErrorHandler';
import { thoughtLogger } from '../lib/logging/thought-logger';
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

  public static getDerivedStateFromError(_error: Error): State {
    return {
      hasError: true,
      _error,
      isRetrying: false
    };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    thoughtLogger.log('error', `Uncaught error: ${_error.message}`, {
      _error,
      componentStack: _errorInfo.componentStack
    });
  }

  private handleReset = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Check if error is API key related
      if (this.state.error?.message.includes('API key')) {
        // Wait for potential env var updates
        await new Promise(_resolve => setTimeout(_resolve, 1000));
      }
      
      this.setState({ hasError: false, error: null, isRetrying: false });
    } catch (retryError) { // Renamed error variable
      console.error("Error during ErrorBoundary reset attempt:", retryError); // Log the error
      this.setState({ isRetrying: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      const { message, details } = ErrorHandler.handle(this.state.error);
      
      return this.props.fallback ?? ( // Use ??
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>
            
            <p className="text-gray-300 mb-4">{message}</p>
            
            {details && (
              <pre className="bg-gray-900 p-3 rounded text-sm text-gray-400 mb-4 overflow-x-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            )}
            
            <button
              onClick={this.handleReset}
              disabled={this.state.isRetrying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
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
