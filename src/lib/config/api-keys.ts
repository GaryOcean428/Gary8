export const getApiKeys = () => {
  return {
    perplexity: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
    google: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    serp: process.env.NEXT_PUBLIC_SERP_API_KEY,
    xai: process.env.NEXT_PUBLIC_XAI_API_KEY,
    groq: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    huggingface: process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN,
    github: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  };
}; 