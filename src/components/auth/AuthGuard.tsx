import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthProvider';
import { LoginForm } from './LoginForm';
import { Loader } from 'lucide-react';
import { getNetworkStatus } from '../../core/supabase/supabase-client';
import { useUserProfile } from '../../hooks/useUserProfile';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [userInitialized, setUserInitialized] = useState(false);
  
  // Wait for both auth and profile to be loaded before rendering
  useEffect(() => {
    if (!loading && !profileLoading) {
      setUserInitialized(true);
    }
  }, [loading, profileLoading]);
  
  // Show loading state
  if (loading || profileLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="card-glass p-8 rounded-xl shadow-xl flex items-center space-x-4 max-w-md">
          <div className="bg-primary/20 rounded-full p-3 glow-primary">
            <Loader className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-1">Loading...</h3>
            <p className="text-sm text-muted-foreground">Please wait while we load your session</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if we're in development mode and network is offline
  const isDev = process.env.NODE_ENV === 'development';
  const isOffline = !getNetworkStatus();
  
  // In development, allow bypassing authentication when offline
  if (!user && isDev && isOffline) {
    return <>{children}</>; // Mock authentication in dev mode when offline
  }

  // Show login form if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black">
        <LoginForm />
      </div>
    );
  }

  // User is authenticated, render children with profile info
  return <>{children}</>;
}