# Gary8: Multi-Agent AI System

A sophisticated multi-agent AI system designed for collaborative task execution, data analysis, and information synthesis. Built with TypeScript and React, featuring a modular architecture with specialized agents working together through a Mixture of Agents (MoA) approach.

## Core Features

- **Multi-Agent Collaboration**: Specialized agents working together on complex tasks
- **Vector Memory System**: Efficient storage and retrieval of contextual information
- **Model Router**: Intelligent routing of requests to appropriate language models
- **MoA Aggregation**: Advanced result synthesis using multi-head attention mechanism
- **Real-time Thought Logging**: Comprehensive logging of agent reasoning and actions

## Environment Setup

The application uses environment variables for configuration. Copy the `.env.example` file to `.env` and fill in the values:

```
cp .env.example .env
```

### Required Environment Variables

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Keys
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
VITE_XAI_API_KEY=your_xai_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

For Supabase Edge Functions, you'll also need to set the environment variables in the Supabase project settings.

## Model Architecture

### Supported Models

- **OpenAI Models**: GPT-4o, GPT-4o-mini, o1, o1-mini, o3-mini
- **Anthropic Models**: Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku
- **Groq Models**: Llama 3.3 70b, Llama3 8B, Llama 3.2 Vision models
- **X.AI (Grok) Models**: Grok-3, Grok-3 Fast, Grok-3 Mini
- **Perplexity Models**: Sonar Reasoning Pro, Sonar Pro
- **Google Models**: Gemini 2.5 Pro, Gemini 2.0 Flash Lite

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Architecture

### Agents

- **Primary Agent**: Orchestrates task delegation and high-level decision making
- **Specialist Agents**: Handle specific tasks like web search and data analysis
- **Task Agents**: Execute focused operations like CSV export and data processing

### Core Systems

- **Model Router**: Routes requests to appropriate models:
  - Llama 3.3 70b for versatile tasks
  - Grok-3 for expert-level queries
  - Sonar for web search and current information

- **Memory System**:
  - Vector-based storage for semantic search
  - Context-aware retrieval
  - Long-term knowledge retention

- **Tools Registry**:
  - Web data fetching and parsing
  - CSV export functionality
  - Competitor analysis tools

## Security

The application supports two ways to handle API keys:

1. **Edge Functions**: Secure method that keeps API keys on the server
2. **Local Storage**: API keys are stored in the browser (less secure, but convenient for development)

You can toggle between these methods in the API Settings panel.