import { execSync } from 'child_process';

export const runTestSuite = async () => {
  try {
    console.log('🧪 Running test suite...');
    execSync('npm run test', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Tests failed:', error);
    return false;
  }
}; 