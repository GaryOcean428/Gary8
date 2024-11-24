// src/lib/services/firebase.ts

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Analytics, getAnalytics } from 'firebase/analytics';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { config } from '../config';
import { thoughtLogger } from '../logging/thought-logger';

class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp;
  private analyticsInstance: Analytics;
  private authInstance: Auth;
  private firestoreInstance: Firestore;

  private constructor() {
    this.app = initializeApp(config.services.firebase);
    this.analyticsInstance = getAnalytics(this.app);
    this.authInstance = getAuth(this.app);
    this.firestoreInstance = getFirestore(this.app);
    thoughtLogger.log('success', 'Firebase service initialized');
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  getApp(): FirebaseApp {
    return this.app;
  }

  getAnalytics(): Analytics {
    return this.analyticsInstance;
  }

  getAuth(): Auth {
    return this.authInstance;
  }

  getFirestore(): Firestore {
    return this.firestoreInstance;
  }
}

export const firebaseService = FirebaseService.getInstance();
