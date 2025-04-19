import { useState, useEffect } from 'react';
import { supabase } from '../core/supabase/supabase-client';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../shared/hooks/useToast';
import { thoughtLogger } from '../lib/logging/thought-logger';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'dev';
  is_dev_user: boolean;
  metadata: Record<string, unknown>;
  profile_complete: boolean;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    async function loadUserProfile() {
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(data as UserProfile);
        thoughtLogger.log('success', 'User profile loaded successfully');
      } catch (e) {
        const err = e as Error;
        setError(err);
        thoughtLogger.log('error', 'Failed to load user profile', { error: err });
        
        addToast({
          type: 'error',
          title: 'Profile Error',
          message: 'Could not load your user profile',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [user, addToast]);

  const updateProfile = async (_updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(_updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as UserProfile);
      addToast({
        type: 'success',
        message: 'Profile updated successfully',
        duration: 3000
      });

      return data;
    } catch (e) {
      const err = e as Error;
      thoughtLogger.log('error', 'Failed to update user profile', { error: err });
      
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update your profile',
        duration: 5000
      });
      
      throw err;
    }
  };

  const isDevUser = !!profile?.is_dev_user;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'dev';

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isDevUser,
    isAdmin
  };
}