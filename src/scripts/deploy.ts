import { execSync } from 'child_process';
import * as fs from 'fs';

const deploy = async (environment: 'development' | 'production') => {
  try {
    // Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    execSync('npm run clean', { stdio: 'inherit' });

    // Build the application
    console.log('🏗️ Building application...');
    execSync(`cross-env NODE_ENV=${environment} npm run build`, { stdio: 'inherit' });

    // Deploy to Firebase
    console.log(`🚀 Deploying to ${environment}...`);
    execSync(`firebase deploy -P ${environment}`, { stdio: 'inherit' });

    console.log('✅ Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
};

// Add these scripts to package.json: 