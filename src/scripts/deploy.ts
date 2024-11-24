import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

const deploy = async (environment: 'development' | 'production') => {
  try {
    // Load environment variables
    dotenv.config({
      path: `.env.${environment}`
    });

    // Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    execSync('npm run clean', { stdio: 'inherit' });

    // Build the application
    console.log('🏗️ Building application...');
    execSync('next build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: environment }
    });

    // Get project ID from environment
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('Firebase project ID not found in environment variables');
    }

    // Deploy to Firebase
    console.log(`🚀 Deploying to ${environment} (${projectId})...`);
    execSync(`firebase use ${projectId} && firebase deploy --only hosting`, { 
      stdio: 'inherit'
    });

    console.log('✅ Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
};

// Run deploy if called directly
if (process.argv[2]) {
  deploy(process.argv[2] as 'development' | 'production');
}