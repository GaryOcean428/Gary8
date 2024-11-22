import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { config } from '../config';
import { thoughtLogger } from '../logging/thought-logger';

class FirebaseService {
  private static instance: FirebaseService;
  private app;
  private analytics;
  private initialized = false;

  private constructor() {
    this.app = initializeApp(config.services.firebase);
    this.analytics = getAnalytics(this.app);
    this.initialized = true;
    thoughtLogger.log('success', 'Firebase service initialized');
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  getApp() {
    return this.app;
  }

  getAnalytics() {
    return this.analytics;
  }
}

export const firebaseService = FirebaseService.getInstance();