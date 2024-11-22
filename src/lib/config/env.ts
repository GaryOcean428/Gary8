// Helper to validate environment variables are present
export const validateEnvVars = () => {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_CONFIG_PUBLIC_KEY',
    'PERPLEXITY_API_KEY',
    'GOOGLE_API_KEY',
    'SERP_API_KEY',
    'XAI_API_KEY',
    'GROQ_API_KEY',
    'HUGGINGFACE_TOKEN',
    'GITHUB_TOKEN',
    'ANTHROPIC_API_KEY'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}; 