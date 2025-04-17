import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthProvider';
import { Brain, Mail, Lock, Loader, WifiOff, AlertCircle } from 'lucide-react';
import { getNetworkStatus } from '../../core/supabase/supabase-client';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!getNetworkStatus());
  const { signIn, signUp } = useAuth();

  // Monitor online/offline status
  useEffect(() => {
    const checkNetworkStatus = () => {
      setIsOffline(!getNetworkStatus());
    };
    
    // Check initially and then on regular intervals
    checkNetworkStatus();
    const intervalId = setInterval(checkNetworkStatus, 5000);
    
    const handleOnline = () => {
      setIsOffline(false);
      setError(null); // Clear network error when back online
    };
    const handleOffline = () => {
      setIsOffline(true);
      setError('Network connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading || isOffline) return;

    setIsLoading(true);
    setError(null);

    try {
      // Double-check network status before proceeding
      if (!getNetworkStatus()) {
        throw new Error('Network connection unavailable. Please check your internet connection.');
      }
      
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isOffline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black px-4">
        <div className="max-w-md w-full space-y-8 card-glass p-8 rounded-lg">
          <div className="text-center">
            <WifiOff className="h-12 w-12 text-destructive mx-auto animate-pulse" />
            <h2 className="mt-6 text-3xl font-bold text-foreground">No Connection</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please check your internet connection and try again
            </p>
            
            {isDevelopment && (
              <div className="mt-6 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">Development Mode</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  In development mode, you can continue testing even when offline.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  Continue to App (Dev Mode)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black px-4">
      <div className="max-w-md w-full space-y-8 card-glass p-8 rounded-lg">
        <div className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto glow-primary">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? 'Sign in to continue to Gary8'
              : 'Sign up to get started with Gary8'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-destructive">{error}</p>
                {error.includes('Network') && (
                  <p className="mt-1 text-xs text-destructive/80">
                    Please check your internet connection and try again
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim() || isOffline}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
          
          {isDevelopment && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground mb-2">
                Development Mode Options
              </p>
              <button
                type="button"
                className="w-full px-3 py-2 text-xs bg-primary/10 text-primary border border-primary/20 rounded-md"
                onClick={() => window.location.reload()}
              >
                Continue to App (Dev Mode)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}