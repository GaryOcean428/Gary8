import * as fs from 'fs';
import * as path from 'path';

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

export const verifyEnvironment = async () => {
  try {
    const envFile = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envFile)) {
      console.error('❌ .env.local file not found');
      return false;
    }

    const envContent = fs.readFileSync(envFile, 'utf8');
    const missingVars = requiredEnvVars.filter(varName => 
      !envContent.includes(varName)
    );

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      return false;
    }

    console.log('✅ Environment variables verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Environment verification failed:', error);
    return false;
  }
}; 