export const CODE_CONSTANTS = {
  RELEVANT_EXTENSIONS: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  EXCLUDED_PATHS: ['node_modules', 'dist', '.git', 'build', 'coverage'],
  MAX_TOKENS: {
    CODE_GENERATION: 2048,
    CODE_REVIEW: 1024
  },
  TEMPERATURES: {
    CODE_GENERATION: 0.2,
    CODE_REVIEW: 0.3
  },
  FIREBASE_COLLECTIONS: {
    USERS: process.env.REACT_APP_FIREBASE_USERS_COLLECTION || 'users',
    CHATS: process.env.REACT_APP_FIREBASE_CHATS_COLLECTION || 'chats',
    MEMORY: process.env.REACT_APP_FIREBASE_MEMORY_COLLECTION || 'memory',
    WORKFLOWS: process.env.REACT_APP_FIREBASE_WORKFLOWS_COLLECTION || 'workflows'
  },

  PROMPT_TEMPLATES: {
    CODE_GENERATION: (language?: string) => 
      `You are an expert programmer. Generate high-quality ${language || ''} code based on the following request:

{prompt}

Provide clean, efficient, and well-documented code with proper error handling.`,
    
    CODE_REVIEW: (language?: string) => 
      `Review the following ${language || ''} code and provide:
1. List of potential issues
2. Improvement suggestions
3. Code quality score (0-100)

Code to review:
\`\`\`
{code}
\`\`\``,
  },

  REGEX_PATTERNS: {
    CODE_BLOCK: /```[\s\S]*?```/g,
    FUNCTION_DEFINITION: /function\s+(\w+)\s*\([^)]*\)/g,
    CLASS_DEFINITION: /class\s+(\w+)/g,
    IMPORT_STATEMENT: /import\s+.*?from\s+['"].*?['"];?/g,
    EXPORT_STATEMENT: /export\s+.*?;?/g,
  },
};
