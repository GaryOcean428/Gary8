# Gary8 Project Documentation

## Core Documentation

### 1. Architecture & Setup
- [Project Overview](architecture/OVERVIEW.md)
- [Setup Guide](architecture/SETUP.md)
- [Deployment Guide](architecture/DEPLOYMENT.md)

### 2. Core Systems
- [Agent System](core/AGENTS.md)
- [Canvas System](core/CANVAS.md)
- [Search System](core/SEARCH.md)
- [Tool Integration](core/TOOLS.md)

### 3. Integrations
- [API Integration](integrations/API.md)
- [Database Integration](integrations/DATABASE.md)
- [GitHub Integration](integrations/GITHUB.md)
- [Model Integration](integrations/MODELS.md)

### 4. Development
- [Contributing Guide](development/CONTRIBUTING.md)
- [Testing Guide](development/TESTING.md)
- [Security Guide](development/SECURITY.md)
- [Performance Guide](development/PERFORMANCE.md)

## Quick Links

### Development Resources
- [API Reference](https://api-docs.gary8.dev)
- [Component Library](https://components.gary8.dev)
- [Status Dashboard](https://status.gary8.dev)

### Key Features
1. **AI Integration**
   - Multi-model routing
   - Tool-use framework
   - Vector storage
   - RAG pipeline

2. **Development Tools**
   - Code analysis
   - Project structure
   - Testing framework
   - Performance monitoring

3. **Canvas System**
   - Design generation
   - Real-time collaboration
   - Component library
   - Theme system

4. **Integrations**
   - GitHub integration
   - Firebase services
   - Redis caching
   - Vector storage

## Project Status

### Current Implementation
✅ Completed:
- Next.js 14 setup
- Multi-model routing
- Basic canvas system
- Firebase integration
- Redis caching
- Vector storage
- Monitoring system
- Error handling
- Security middleware

🚧 In Progress:
- Advanced RAG pipeline
- Enhanced tool capabilities
- Performance optimization
- Testing framework

📋 Planned:
- Advanced canvas features
- Extended tool library
- Enhanced security
- Scaling infrastructure

## Directory Structure
```bash
gary8-project/
├── docs/                  # Documentation
│   ├── architecture/     # System architecture
│   ├── core/            # Core systems
│   ├── integrations/    # External integrations
│   └── development/     # Development guides
├── src/                  # Source code
│   ├── app/             # Next.js app
│   ├── components/      # React components
│   ├── lib/             # Core libraries
│   └── types/           # TypeScript types
├── public/              # Static assets
└── tests/               # Test suites
```

## Getting Started

1. **Installation**
```bash
git clone https://github.com/your-org/gary8-project.git
cd gary8-project
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
# Configure environment variables
```

3. **Development**
```bash
npm run dev
```

## Contributing

See [CONTRIBUTING.md](development/CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.
