import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getCurrentConfig } from '../config/deployment';
import { thoughtLogger } from '../logging/thought-logger';

let initialized = false;
let app: FirebaseApp | null = null;

export const initializeFirebase = () => {
  if (initialized) {
    return;
  }

  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Validate config
    const missingKeys = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      throw new Error(`Missing Firebase configuration keys: ${missingKeys.join(', ')}`);
    }

    app = initializeApp(config);
    initialized = true;
    thoughtLogger.log('success', 'Firebase initialized successfully');
  } catch (error) {
    thoughtLogger.log('error', 'Failed to initialize Firebase', { error });
    throw error;
  }
};

export const getFirebaseApp = () => {
  if (!initialized || !app) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return app;
};

export const auth = () => getAuth(getFirebaseApp());
export const db = () => getFirestore(getFirebaseApp());

export const isInitialized = () => initialized;

const storage = getStorage(app);

const config = getCurrentConfig();

if (config.firebase.useEmulator) {
  connectAuthEmulator(auth(), `http://localhost:${config.firebase.emulatorPorts.auth}`);
  connectFirestoreEmulator(db(), 'localhost', config.firebase.emulatorPorts.firestore);
  connectStorageEmulator(storage, 'localhost', config.firebase.emulatorPorts.storage);
}

// Add rate limiting
const rateLimiter = {
  maxRequests: 100,
  perWindow: 60000, // 1 minute
  requests: new Map()
};

export const checkRateLimit = (userId: string) => {
  // ... rate limiting implementation
};

export { app, storage };
