'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { agentSystem } from '../lib/agent-system';
import { LoadingIndicator } from '../components/LoadingIndicator';
import firebase from 'firebase';

interface Config {
  firebase: {
    app: ReturnType<typeof initializeApp>;
    db: ReturnType<typeof getFirestore>;
    auth: ReturnType<typeof getAuth>;
    storage: ReturnType<typeof getStorage>;
  } | null;
  apiEndpoints: {
    base: string;
    search: string;
    ai: string;
  };
  isInitialized: boolean;
}

interface ConfigContextType {
  config: Config;
  isLoading: boolean;
  error: Error | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Log environment variables for debugging
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0, 5) + '...',
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  TAVILY_API_KEY: process.env.NEXT_PUBLIC_TAVILY_API_KEY?.slice(0, 5) + '...',
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>({
    firebase: null,
    apiEndpoints: {
      base: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      search: '/api/search',
      ai: '/api/ai',
    },
    isInitialized: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Add timeout promise for initialization
        const initPromise = Promise.race([
          initializeConfig(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Initialization timeout')), 15000)
          )
        ]);

        await initPromise;
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize'));
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  async function initializeConfig() {
    try {
      // Initialize Firebase
      console.log('Initializing Firebase with config:', {
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        hasApiKey: !!firebaseConfig.apiKey,
      });

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const auth = getAuth(app);
      const storage = getStorage(app);

      // Check Redis status through API route
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await fetch('/api/redis/status');
          const data = await response.json();
          if (!data.isRunning) {
            console.warn('Redis server is not running. Some features may be limited.');
          }
        } catch (redisError) {
          console.warn('Failed to check Redis status:', redisError);
        }
      }

      // Initialize Agent System with validation
      try {
        await agentSystem.initialize();
      } catch (agentError) {
        console.warn('Agent system initialization warning:', agentError);
        // Continue loading even if agent system has warnings
      }

      setConfig(prev => ({
        ...prev,
        firebase: { app, db, auth, storage },
        isInitialized: true,
      }));
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  // Show loading state with fallback UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingIndicator 
          state="thinking" 
          subText="Initializing system..." 
        />
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 max-w-sm mx-auto">
          <h1 className="text-xl font-semibold text-red-500 mb-4">Initialization Error</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
