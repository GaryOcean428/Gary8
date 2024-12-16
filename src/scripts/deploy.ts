import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { verifyEnvironment } from './verify-env';
import { DeploymentChecker } from './deployment-checklist';

const deploy = async (environment: 'development' | 'production', isPreview = true) => {
  try {
    // Run deployment checks
    const checker = new DeploymentChecker();
    const checksPass = await checker.runAllChecks(environment);
    
    if (!checksPass) {
      throw new Error('Deployment checks failed');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Load environment variables
    dotenv.config({
      path: `.env.${environment}`
    });

    // Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    execSync('npm run clean', { stdio: 'inherit' });

    // Build the application
    console.log('🏗️ Building application...');
    try {
      execSync('next build', { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          NODE_ENV: 'production'
        }
      });
    } catch (error) {
      console.error('Build failed. Please check the error messages above.');
      process.exit(1);
    }

    // Get project ID from environment
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('Firebase project ID not found in environment variables');
    }

    // Deploy to Firebase
    if (isPreview) {
      console.log(`🚀 Deploying preview channel for ${environment} (${projectId})...`);
      execSync(`firebase hosting:channel:deploy gary8_${environment}_preview`, { 
        stdio: 'inherit'
      });
    } else {
      console.log(`🚀 Deploying to ${environment} (${projectId})...`);
      execSync(`firebase use ${projectId} && firebase deploy --only hosting`, { 
        stdio: 'inherit'
      });
    }

    console.log('✅ Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
};

// Get command line arguments
const environment = process.argv[2] as 'development' | 'production';
const isPreview = process.argv[3] === '--preview' || process.argv[3] === '-p';

// Add validation for deployment environment
if (!['development', 'production'].includes(environment)) {
  throw new Error('Invalid deployment environment');
}

deploy(environment, isPreview);