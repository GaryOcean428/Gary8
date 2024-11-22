# Gary8 Project Documentation

## Overview

Gary8 is an advanced AI agent system designed for complex code analysis, generation, and project management tasks. This documentation provides a comprehensive guide to the project's features, architecture, and development practices.

## Core Components

### AI Integration
- Multi-model routing with Groq, Perplexity, X.AI, and Anthropic
- Tool-use capabilities via Toolhouse
- Vector storage with Pinecone
- RAG processing pipeline

### Development Tools
- Code analysis and generation
- Project structure optimization
- Testing assistance
- Performance monitoring

### Canvas System
- Natural language design generation
- Real-time collaborative editing
- Component-based layouts
- Theme support (dark/light modes)

### Integrations
- GitHub repository management
- Firebase backend services
- Redis caching layer
- Multiple AI model providers
- Vector storage for context

## Project Structure

```bash
gary8-project/
├── src/                    # Source code
│   ├── app/               # Next.js app directory
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── canvas/       # Canvas system components
│   │   ├── settings/     # Settings components
│   │   └── ui/          # Common UI components
│   ├── lib/              # Core libraries
│   │   ├── agents/      # AI agents implementation
│   │   ├── api/         # API clients
│   │   ├── canvas/      # Canvas system core
│   │   ├── tools/       # Tool implementations
│   │   ├── utils/       # Utility functions
│   │   └── config/      # Configuration
│   ├── providers/        # React context providers
│   └── types/           # TypeScript type definitions
├── docs/                 # Documentation
└── public/              # Static assets
```

## Key Features

### AI Models
- Groq: Code and general tasks
- Perplexity: Search and current information
- X.AI (Grok): Expert-level queries
- Anthropic (Claude): Tool-use and reasoning

### Tool Integration
- Toolhouse for structured tool use
- Web browsing and data extraction
- Code analysis and generation
- Project management tools

### Development Features
- TypeScript for type safety
- Next.js 14 for modern React
- Tailwind CSS for styling
- NextUI for components

## Getting Started

1. **Clone and Install**
   ```bash
   git clone [repository-url]
   cd gary8-project
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure environment variables
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## Configuration

The system uses multiple API providers that need to be configured in `.env.local`:

- Groq API for LLM capabilities
- Perplexity API for search
- X.AI API for expert queries
- Anthropic API for tool use
- Toolhouse API for structured tools
- Firebase for backend services
- Pinecone for vector storage

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Document complex functions
- Write unit tests for critical paths

### Security
- Never commit API keys
- Validate all inputs
- Use proper error handling
- Follow security best practices

### Performance
- Use proper caching strategies
- Optimize API calls
- Monitor memory usage
- Profile response times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
