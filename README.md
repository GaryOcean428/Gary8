# Agent One: Multi-Agent AI System

A sophisticated multi-agent AI system designed for collaborative task execution, data analysis, and information synthesis. Built with TypeScript and React, featuring a modular architecture with specialized agents working together through a Mixture of Agents (MoA) approach.

## Core Features

- **Multi-Agent Collaboration**: Specialized agents working together on complex tasks
- **Vector Memory System**: Efficient storage and retrieval of contextual information
- **Model Router**: Intelligent routing of requests to appropriate language models
- **MoA Aggregation**: Advanced result synthesis using multi-head attention mechanism
- **Real-time Thought Logging**: Comprehensive logging of agent reasoning and actions

## Model Architecture

### Groq Models
Documentation: [Groq API Docs](https://console.groq.com/docs/models)

- **Base Models**:
  - `llama-3.2-3b-preview`: Small model for simple tasks
  - `llama-3.2-7b-preview`: Medium model for balanced performance
  - `llama-3.2-70b-preview`: Large model for complex tasks

- **Tool-Use Models**:
  - `llama3-groq-8b-8192-tool-use-preview`: Specialized for tool interactions
  - `llama3-groq-70b-8192-tool-use-preview`: Advanced tool use and reasoning

### Perplexity Models
Documentation: [Perplexity Model Cards](https://docs.perplexity.ai/guides/model-cards)

- `llama-3.1-sonar-small-128k-online`: 8B parameters, 127K context
- `llama-3.1-sonar-large-128k-online`: 70B parameters, 127K context
- `llama-3.1-sonar-huge-128k-online`: 405B parameters, 127K context

### X.AI (Grok) Models
Documentation: [X.AI API Docs](https://docs.x.ai/api)

- `grok-beta`: Expert-level queries and complex reasoning

## Architecture

### Agents

- **Primary Agent**: Orchestrates task delegation and high-level decision making
- **Specialist Agents**: Handle specific tasks like web search and data analysis
- **Task Agents**: Execute focused operations like CSV export and data processing

### Core Systems

- **Model Router**: Routes requests to appropriate models:
  - Llama 3.2 models for varying complexity tasks
  - Grok-Beta for expert-level queries
  - Sonar for web search and current information

- **Memory System**:
  - Vector-based storage for semantic search
  - Context-aware retrieval
  - Long-term knowledge retention

- **Tools Registry**:
  - Web data fetching and parsing
  - CSV export functionality
  - Competitor analysis tools

[Rest of README remains the same...]