import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new AppError(
      `Missing required environment variable: ${envVar}`,
      'CONFIG_ERROR'
    );
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

let isInitialized = false;

async function initializeFirebase() {
  if (isInitialized) {
    return true;
  }

  try {
    thoughtLogger.log('execution', 'Initializing Firebase');

    // Set persistence to LOCAL
    await setPersistence(auth, browserLocalPersistence);
    thoughtLogger.log('success', 'Auth persistence configured');

    // Enable emulators in development
    if (import.meta.env.DEV) {
      try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
        thoughtLogger.log('success', 'Firebase emulators connected');
      } catch (emulatorError) {
        thoughtLogger.log('warning', 'Failed to connect to Firebase emulators, falling back to production', { error: emulatorError });
      }
    }

    // Verify auth is working
    await auth.updateCurrentUser(null);
    
    thoughtLogger.log('success', 'Firebase initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    thoughtLogger.log('error', 'Failed to initialize Firebase', { error });
    isInitialized = false;
    throw new AppError(
      'Failed to initialize Firebase',
      'FIREBASE_ERROR',
      error
    );
  }
}

// Export initialized services and initialization function
export { app, auth, storage, firestore, initializeFirebase, isInitialized };