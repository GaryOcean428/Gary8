import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getCurrentConfig } from '../config/deployment';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// Add error handling for missing environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase configuration');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const config = getCurrentConfig();

if (config.firebase.useEmulator) {
  connectAuthEmulator(auth, `http://localhost:${config.firebase.emulatorPorts.auth}`);
  connectFirestoreEmulator(db, 'localhost', config.firebase.emulatorPorts.firestore);
  connectStorageEmulator(storage, 'localhost', config.firebase.emulatorPorts.storage);
}

// Add initialization status check
let initialized = false;
export const initializeFirebase = () => {
  if (initialized) return;
  // ... initialization code ...
  initialized = true;
};

// Add rate limiting
const rateLimiter = {
  maxRequests: 100,
  perWindow: 60000, // 1 minute
  requests: new Map()
};

export const checkRateLimit = (userId: string) => {
  // ... rate limiting implementation
};

export { app, auth, db, storage };
