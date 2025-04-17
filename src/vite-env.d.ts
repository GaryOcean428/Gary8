/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_PERPLEXITY_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_XAI_API_KEY?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}