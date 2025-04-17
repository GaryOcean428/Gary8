import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { useToast } from '../../shared/hooks/useToast';
import { thoughtLogger } from '../../lib/logging/thought-logger';
import { supabase, getNetworkStatus } from '../supabase/supabase-client';
import { AppError } from '../../lib/errors/AppError';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
        thoughtLogger.log('observation', `Auth state changed: ${event}`);
      }
    );

    // Check for active session on load
    const initializeAuth = async () => {
      try {
        // Check network status first
        if (!getNetworkStatus()) {
          thoughtLogger.log('warning', 'Network is offline during auth initialization');
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        thoughtLogger.log('error', 'Failed to get session', { error });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = (error: AuthError | Error) => {
    // Enhanced network connectivity check
    if (!getNetworkStatus() || 
        (error.message && (
          error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('connection') ||
          error.message.includes('offline')
        ))
    ) {
      const networkError = 'Network error. Please check your connection and try again.';
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: networkError,
        duration: 5000
      });
      throw new AppError(networkError, 'NETWORK_ERROR');
    }

    // Map Supabase error messages to user-friendly messages
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'User already registered': 'An account already exists with this email',
      'Email not confirmed': 'Please verify your email address',
      'Password should be at least 6 characters': 'Password should be at least 6 characters',
      'Rate limit exceeded': 'Too many attempts. Please try again later'
    };

    const authError = error as AuthError;
    const friendlyMessage = authError.message ? (errorMessages[authError.message] || authError.message) : 'An unknown error occurred';

    addToast({
      type: 'error',
      title: 'Authentication Error',
      message: friendlyMessage,
      duration: 5000
    });

    throw new AppError(friendlyMessage, 'AUTH_ERROR', error);
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      thoughtLogger.log('execution', 'Attempting sign in');
      
      // Pre-emptive network check
      if (!getNetworkStatus()) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Add request timeout to prevent hanging auth requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        clearTimeout(timeoutId);
        
        if (error) throw error;

        addToast({
          type: 'success',
          message: 'Successfully signed in',
          duration: 3000
        });
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      thoughtLogger.log('error', 'Sign in failed', { error });
      
      // Better handle network and auth errors
      if (error instanceof AuthError) {
        handleAuthError(error);
      } else if (!getNetworkStatus() || (error instanceof Error && 
          (error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('connection') ||
           error.message.includes('abort') ||
           error.message.includes('timeout')))) {
        const networkError = 'Network error. Please check your connection and try again.';
        addToast({
          type: 'error',
          title: 'Connection Error',
          message: networkError,
          duration: 5000
        });
        throw new AppError(networkError, 'NETWORK_ERROR');
      } else {
        const message = error instanceof Error ? error.message : 'An unknown authentication error occurred';
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message,
          duration: 5000
        });
        throw new AppError(message, 'AUTH_ERROR', error);
      }
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      thoughtLogger.log('execution', 'Attempting sign up');
      
      // Pre-emptive network check
      if (!getNetworkStatus()) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Add request timeout to prevent hanging auth requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        clearTimeout(timeoutId);
        
        if (error) throw error;

        addToast({
          type: 'success',
          message: 'Account created successfully',
          duration: 3000
        });
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      thoughtLogger.log('error', 'Sign up failed', { error });
      
      // Better handle network and auth errors
      if (error instanceof AuthError) {
        handleAuthError(error);
      } else if (!getNetworkStatus() || (error instanceof Error && 
          (error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('connection') ||
           error.message.includes('abort') ||
           error.message.includes('timeout')))) {
        const networkError = 'Network error. Please check your connection and try again.';
        addToast({
          type: 'error',
          title: 'Connection Error',
          message: networkError,
          duration: 5000
        });
        throw new AppError(networkError, 'NETWORK_ERROR');
      } else {
        const message = error instanceof Error ? error.message : 'An unknown authentication error occurred';
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message,
          duration: 5000
        });
        throw new AppError(message, 'AUTH_ERROR', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      thoughtLogger.log('execution', 'Attempting sign out');
      
      // Handle offline sign out specially
      if (!getNetworkStatus()) {
        // Allow signing out when offline in development mode
        if (process.env.NODE_ENV === 'development') {
          setUser(null);
          addToast({
            type: 'info',
            message: 'Signed out locally. Some data may sync when you reconnect.',
            duration: 3000
          });
          return;
        } else {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Successfully signed out',
        duration: 3000
      });
    } catch (error) {
      thoughtLogger.log('error', 'Sign out failed', { error });
      
      if (error instanceof AuthError) {
        handleAuthError(error);
      } else if (!getNetworkStatus() || (error instanceof Error && 
          (error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('connection')))) {
        const networkError = 'Network error. Please check your connection and try again.';
        addToast({
          type: 'error',
          title: 'Connection Error',
          message: networkError,
          duration: 5000
        });
        throw new AppError(networkError, 'NETWORK_ERROR');
      } else {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message,
          duration: 5000
        });
        throw new AppError(message, 'AUTH_ERROR', error);
      }
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}