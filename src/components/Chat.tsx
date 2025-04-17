import React, { useState, useRef, useEffect } from 'react';
// Removed duplicate/unused: ChevronDown, Search. Combined imports. Corrected Send import.
import { Pause, Play, Sparkles, RotateCcw, Share2, Filter, User, Bot, Terminal, Hash, Send, X } from 'lucide-react'; 
import { AgentSystem } from '../lib/agent-system';
import { LoadingIndicator } from './LoadingIndicator';
import { useChat } from '../hooks/useChat';
import { thoughtLogger } from '../lib/logging/thought-logger';
import { SaveChatButton } from './SaveChatButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ApiStatusDisplay } from './ApiStatusDisplay';
// Removed unused: VirtualizedMessage
import { ProgressiveMessage } from './ProgressiveMessage';
// Removed unused: needsVirtualization
import { performanceMonitor } from '../lib/utils/PerformanceMonitor';
import { AgentRegistry } from '../lib/agents/core/agent-registry';
import { CanvasSandbox } from './canvas/CanvasSandbox';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';
import { Badge } from './ui/Badge';
import ReactMarkdown from 'react-markdown';
import './Chat.css'; // Import CSS

// Define Message type based on usage
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string; // Optional model property observed in JSX
}

// Define Agent type based on usage (assuming it matches Canvas.tsx)
interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
}

type ProcessingPhase = 'thinking' | 'searching' | 'processing' | 'generating';

export function Chat() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>('thinking');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showApiStatus, setShowApiStatus] = useState(false);
  const [filters, setFilters] = useLocalStorage('chat.filters', {
    model: 'auto', // 'auto', 'grok', 'claude', 'openai', etc.
    searchEnabled: true,
    streamingEnabled: true
  });
  
  // Agent mode state
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [showAgentList, setShowAgentList] = useState(false);
  const [activeAgent, setActiveAgent] = useLocalStorage<string | null>('chat.activeAgent', null);
  const [agentRegistry] = useState(() => AgentRegistry.getInstance());
  const [availableAgents, setAvailableAgents] = useState(agentRegistry.getAllAgents());
  const { addToast } = useToast();
  
  // Canvas sandbox state
  const [showSandbox, setShowSandbox] = useState(false);
  // const [sandboxCode, setSandboxCode] = useState(''); // Removed: seems unused
  const [sandboxLanguage, setSandboxLanguage] = useState('javascript');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, addMessage, currentChatId, saveChat, clearMessages } = useChat();
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      // Set height based on scroll height, capped at 200px
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; 
    }
  }, [input]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Update available agents from registry
  useEffect(() => {
    const updateAgents = () => {
      setAvailableAgents(agentRegistry.getAllAgents());
    };
    
    updateAgents();
    
    // Add listener for agent registry changes
    agentRegistry.on('agent-added', updateAgents);
    agentRegistry.on('agent-removed', updateAgents);
    
    return () => {
      agentRegistry.off('agent-added', updateAgents);
      agentRegistry.off('agent-removed', updateAgents);
    };
  }, [agentRegistry]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Consider scrolled to bottom if within a small threshold (e.g., 10px)
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setAutoScroll(isScrolledToBottom);
  };

  const handleModelChange = (model: string) => {
    setFilters(prev => ({ ...prev, model }));
    setShowFilterMenu(false);
  };

  const toggleFilter = (key: 'searchEnabled' | 'streamingEnabled') => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateProcessingPhase = (state?: string) => {
    if (!state) return;
    
    switch (state) {
      case 'searching': setProcessingPhase('searching'); break;
      case 'retrieving':
      case 'processing': setProcessingPhase('processing'); break;
      case 'thinking':
      case 'reasoning': setProcessingPhase('thinking'); break;
      default: setProcessingPhase('generating');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isProcessing) return;

    // Check for commands first
    if (trimmedInput.startsWith('/')) {
      await handleCommand(trimmedInput);
      return;
    }

    performanceMonitor.startMeasure('message_processing', {
      inputLength: trimmedInput.length,
      messageCount: messages.length
    });

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now()
    };

    setInput(''); // Clear input immediately
    setIsProcessing(true);
    setProcessingPhase('thinking');
    setAutoScroll(true); // Ensure scroll on new message

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px'; // Reset textarea height
    }

    try {
      thoughtLogger.log('execution', 'Processing user message');
      await addMessage(userMessage);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '', // Start with empty content for streaming
        timestamp: Date.now()
      };
      await addMessage(assistantMessage); // Add the placeholder message

      let currentContent = '';
      let chunkCount = 0;
      const startTime = Date.now();
      
      const system = AgentSystem.getInstance();
      await system.processMessage(
        userMessage.content,
        (contentChunk) => { // Renamed for clarity
          if (!isPaused) {
            currentContent += contentChunk;
            chunkCount++;
            
            // Update the existing assistant message content
            addMessage((currentMessages: Message[]) => { 
              return currentMessages.map((msg: Message) => 
                msg.id === assistantMessage.id
                  ? { ...msg, content: currentContent }
                  : msg
              );
            });
          }
        },
        updateProcessingPhase
      );

      // Save chat if it's a new one
      if (!currentChatId) {
        await saveChat('New Chat'); 
      }

      performanceMonitor.measureStreamingPerformance({
        streamDuration: Date.now() - startTime,
        contentSize: currentContent.length,
        chunkCount,
        avgChunkSize: currentContent.length / Math.max(1, chunkCount),
        windowWidth: window.innerWidth,
      });

      thoughtLogger.log('success', 'Message processed successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to process message', { error });
      
      if (error instanceof Error && 
         (error.message.includes('API') || error.message.includes('key') || error.message.includes('configuration'))) {
        setShowApiStatus(true);
      }
      
      await addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
    } finally {
      setIsProcessing(false);
      setProcessingPhase('thinking'); // Reset phase
      performanceMonitor.endMeasure('message_processing');
    }
  };

  // --- Command Handling Logic ---

  const handleAgentCommand = (args: string[]) => {
    if (args.length === 0) {
      const nextIsAgentMode = !isAgentMode;
      setIsAgentMode(nextIsAgentMode);
      setInput('');
      addToast({ type: 'info', message: `Agent mode ${nextIsAgentMode ? 'enabled' : 'disabled'}`, duration: 3000 });
      setShowAgentList(nextIsAgentMode);
      if (!nextIsAgentMode) setActiveAgent(null);
      return;
    }

    const agentAction = args[0]?.toLowerCase();
    if (agentAction === 'list') {
      setShowAgentList(true);
      setInput('');
    } else if (agentAction === 'activate' && args[1]) {
      const agentName = args.slice(1).join(' ');
      const agent = availableAgents.find((a: Agent) => a.name.toLowerCase() === agentName.toLowerCase());
      if (agent) {
        setActiveAgent(agent.id);
        setIsAgentMode(true);
        setInput('');
        addToast({ type: 'success', message: `Activated agent: ${agent.name}`, duration: 3000 });
      } else {
        addToast({ type: 'error', message: `Agent not found: ${agentName}`, duration: 3000 });
      }
    } else {
       addToast({ type: 'warning', message: 'Invalid agent command. Use /agent list or /agent activate [name].' });
    }
  };

  const handleSandboxCommand = (args: string[]) => {
    if (args.length === 0) {
      setShowSandbox(!showSandbox);
      setInput('');
      return;
    }
    
    if (args[0]?.toLowerCase() === 'language' && args[1]) {
      const language = args[1].toLowerCase();
      const supportedLanguages = ['javascript', 'python', 'html'];
      if (supportedLanguages.includes(language)) {
        setSandboxLanguage(language);
        setShowSandbox(true);
        setInput('');
        addToast({ type: 'success', message: `Sandbox language set to ${language}`, duration: 3000 });
      } else {
        addToast({ type: 'error', message: `Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}`, duration: 3000 });
      }
    } else {
       addToast({ type: 'warning', message: 'Invalid sandbox command. Use /sandbox language [lang].' });
    }
  };

  const handleHelpCommand = async () => {
     await addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `**Available Commands**\n\n* \`/agent\` - Toggle agent mode\n* \`/agent list\` - Show available agents\n* \`/agent activate [name]\` - Activate a specific agent\n* \`/sandbox\` - Toggle code sandbox\n* \`/sandbox language [lang]\` - Set sandbox language (javascript, python, html)\n* \`/clear\` - Clear chat messages\n* \`/help\` - Show this help message`,
        timestamp: Date.now()
      });
      setInput('');
  };
  
  const handleClearCommand = () => {
      clearMessages();
      setInput('');
      addToast({ type: 'info', message: 'Chat cleared', duration: 2000 });
  };

  const handleUnknownCommand = async (command: string) => {
     await addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Unknown command: ${command}\nType \`/help\` to see available commands.`,
        timestamp: Date.now()
      });
      setInput('');
  };

  const handleCommand = async (commandText: string) => {
    const commandParts = commandText.trim().split(' ');
    const command = commandParts[0].toLowerCase();
    const args = commandParts.slice(1);

    switch (command) {
      case '/agent': handleAgentCommand(args); break;
      case '/sandbox': handleSandboxCommand(args); break;
      case '/clear': handleClearCommand(); break; // Removed braces as they are not needed here
      case '/help': await handleHelpCommand(); break;
      default: await handleUnknownCommand(command); break;
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the current conversation?')) {
      clearMessages();
    }
  };

  const activateAgent = (agentId: string) => {
    setActiveAgent(agentId);
    setShowAgentList(false);
    const agent = availableAgents.find((a: Agent) => a.id === agentId);
    if (agent) {
      addToast({ type: 'success', message: `Activated agent: ${agent.name}`, duration: 3000 });
    }
  };

  // Helper to render message bubble classes
  const getBubbleClasses = (role: Message['role']) => {
    if (role === 'user') return 'bg-secondary/90 text-secondary-foreground rounded-l-lg rounded-tr-lg card-elevated';
    if (role === 'system') return 'bg-destructive/90 text-destructive-foreground rounded-lg card-elevated glow-destructive';
    return 'bg-card/90 text-card-foreground rounded-r-lg rounded-tl-lg card-elevated';
  };

  // Helper to render message role icon and name
  const renderRoleInfo = (role: Message['role']) => {
    if (role === 'user') {
      return <div className="flex items-center text-xs text-secondary-foreground/70"><User className="w-3 h-3 mr-1" /> User</div>;
    }
    if (role === 'system') {
      return <div className="flex items-center text-xs text-destructive-foreground/70"><Terminal className="w-3 h-3 mr-1" /> System</div>;
    }
    if (activeAgent) {
      const agentName = availableAgents.find((a: Agent) => a.id === activeAgent)?.name ?? 'Assistant';
      return <div className="flex items-center text-xs text-primary/70"><Bot className="w-3 h-3 mr-1" /> {agentName}</div>;
    }
    return <div className="flex items-center text-xs text-card-foreground/70"><Bot className="w-3 h-3 mr-1" /> Assistant</div>;
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-0 lg:pt-4">
      {/* Agent status indicator */}
      {isAgentMode && (
        <div className="mx-4 mb-2 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg py-2 px-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Agent Mode</span>
            {activeAgent && (
              <Badge variant="outline" className="text-xs">
                {availableAgents.find((a: Agent) => a.id === activeAgent)?.name ?? 'Unknown Agent'} {/* Use ?? */}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="xs" onClick={() => { setIsAgentMode(false); setActiveAgent(null); }}>
            Deactivate
          </Button>
        </div>
      )}
    
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && !showApiStatus && !showSandbox && !showAgentList && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8 card-glass card-elevated">
              <h2 className="text-2xl font-bold mb-4">Gary8</h2>
              <p className="text-muted-foreground mb-6">
                Ask me anything - I can search the web, analyze data, generate code, and more.
              </p>
              <div className="grid grid-cols-1 gap-3 text-left text-sm">
                {[
                  "What's the latest in quantum computing?",
                  "Analyze the trends in renewable energy adoption",
                  "Generate a React component for a dynamic form",
                  "How can I optimize my SQLite database queries?"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    className="p-3 text-left rounded-lg bg-muted hover:bg-accent/20 transition-colors"
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show API status display when needed */}
        {(showApiStatus || (messages.length === 0 && showApiStatus)) && (
          <div className="mt-8 max-w-md mx-auto">
            <ApiStatusDisplay />
            <div className="mt-4 text-center">
              <button className="px-4 py-2 text-sm text-primary hover:text-primary/80" onClick={() => setShowApiStatus(false)}>
                Hide
              </button>
            </div>
          </div>
        )}

        {/* Show agent list when requested */}
        {showAgentList && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="rounded-lg p-4 bg-card/50 backdrop-blur-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"> <Bot className="w-5 h-5 text-primary" /> <h3 className="font-medium">Available Agents</h3> </div>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowAgentList(false)} aria-label="Close agent list"> <X className="w-4 h-4" /> </button>
              </div>
              {availableAgents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground"> <p>No agents available</p> </div>
              ) : (
                <div className="space-y-2">
                  {availableAgents.map((agent: Agent) => (
                    <button
                      key={agent.id}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${ activeAgent === agent.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted' }`}
                      onClick={() => activateAgent(agent.id)}
                    >
                      <div> <div className="font-medium">{agent.name}</div> <div className="text-xs opacity-80">Role: {agent.role}</div> </div>
                      <div> {agent.capabilities.includes('mcp') ? <Badge variant="secondary" className="text-xs">MCP</Badge> : <Badge variant="outline" className="text-xs">Standard</Badge>} </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 text-xs text-muted-foreground"> <p>Activate with <code className="bg-muted px-1 py-0.5 rounded">/agent activate [name]</code></p> </div>
            </div>
          </div>
        )}

        {/* Code sandbox */}
        {showSandbox && (
          <div className="my-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Code Sandbox</h3>
              <Button variant="outline" size="sm" onClick={() => setShowSandbox(false)}> Close Sandbox </Button>
            </div>
            <CanvasSandbox
              language={sandboxLanguage}
              height="300px"
              onExecute={result => { addMessage({ id: crypto.randomUUID(), role: 'system', content: `**Sandbox Result:**\n\`\`\`\n${result}\n\`\`\``, timestamp: Date.now() }); }}
            />
          </div>
        )}

        {messages.map((message: Message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {(() => {
              const bubbleClass = getBubbleClasses(message.role);
              const streamingClass = (message.role === 'assistant' && message.content === '' && isProcessing) ? `streaming-cursor streaming-cursor-${processingPhase}` : '';
              return (
                <div className={`max-w-[95%] sm:max-w-[80%] rounded-lg p-4 shadow-lg backdrop-blur-sm ${bubbleClass} ${streamingClass}`}>
                  {renderRoleInfo(message.role)}
                  {message.role === 'assistant' && message.content.length > 0 ? (
                    <ProgressiveMessage content={message.content} isLoading={isProcessing && message.content === ''} streamingPhase={processingPhase} className="prose prose-invert max-w-none break-words" />
                  ) : (
                    <div className="prose prose-invert max-w-none break-words"> <ReactMarkdown>{String(message.content ?? '')}</ReactMarkdown> </div>
                  )}
                  {message.model && (
                    <div className="mt-2 text-xs text-muted-foreground flex gap-1 items-center"> <span className="badge badge-primary">{message.model}</span> <span className="text-muted-foreground">{new Date(message.timestamp).toLocaleTimeString()}</span> </div>
                  )}
                </div>
              );
            })()} 
          </motion.div>
        ))}
        {isProcessing && !messages.some((m: Message) => m.role === 'assistant' && m.content === '') && (
          <div className="flex justify-start"> <div className="bg-card backdrop-blur-sm rounded-lg p-3 shadow-lg"> <LoadingIndicator state={processingPhase} /> </div> </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border backdrop-blur-sm bg-background/50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col sm:flex-row items-end gap-2">
          <div className="flex gap-2">
            <div className="relative">
              <button type="button" onClick={() => setShowFilterMenu(!showFilterMenu)} className={`p-3 rounded-lg transition-colors text-secondary hover:text-secondary-foreground hover:bg-secondary/10`} title="Filters" aria-label="Show Filters"> <Filter className="w-5 h-5" /> </button>
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 mb-2 w-64 card-glass p-3 z-10">
                    <div className="font-medium mb-2">Chat Settings</div>
                    <div className="space-y-3">
                      <div className="mb-2"> <button onClick={() => setShowApiStatus(!showApiStatus)} className="text-sm text-primary hover:underline"> Check API Connection Status </button> </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Model Selection</label>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {['auto', 'grok', 'claude', 'openai', 'groq'].map(model => (
                            <button key={model} type="button" onClick={() => handleModelChange(model)} className={`px-2 py-1 text-xs rounded-full ${ filters.model === model ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80' }`}> {model.charAt(0).toUpperCase() + model.slice(1)} </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="webSearchToggle" className="text-sm text-muted-foreground"> Web Search </label>
                        <button id="webSearchToggle" type="button" onClick={() => toggleFilter('searchEnabled')} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ filters.searchEnabled ? 'bg-primary' : 'bg-muted' }`}> <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${ filters.searchEnabled ? 'translate-x-5' : 'translate-x-1' }`} /> </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="streamingToggle" className="text-sm text-muted-foreground"> Streaming Response </label>
                        <button id="streamingToggle" type="button" onClick={() => toggleFilter('streamingEnabled')} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ filters.streamingEnabled ? 'bg-primary' : 'bg-muted' }`}> <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${ filters.streamingEnabled ? 'translate-x-5' : 'translate-x-1' }`} /> </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button type="button" onClick={() => setIsPaused(!isPaused)} className={`hidden sm:flex p-3 rounded-lg transition-colors ${ isPaused ? 'text-success hover:text-success-foreground hover:bg-success/10' : 'text-warning hover:text-warning-foreground hover:bg-warning/10' }`} title={isPaused ? 'Resume' : 'Pause'} disabled={!isProcessing} aria-label={isPaused ? 'Resume processing' : 'Pause processing'}> {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />} </button>
            <button type="button" onClick={handleReset} className="hidden sm:flex p-3 rounded-lg transition-colors text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10" title="New Chat" aria-label="Start New Chat"> <RotateCcw className="w-5 h-5" /> </button>
            <div className="relative"> <button type="button" className="hidden sm:flex p-3 rounded-lg transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10" title="Commands" aria-label="Show Commands" onClick={() => { setInput(input.startsWith('/') ? '' : '/'); textareaRef.current?.focus(); }}> <Hash className="w-5 h-5" /> </button> </div>
          </div>
          <div className="flex-1 relative w-full">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                if (e.key === 'Tab' && input.startsWith('/') && !input.includes(' ')) {
                  e.preventDefault();
                  const commands = ['/agent', '/sandbox', '/clear', '/help'];
                  const matchingCommands = commands.filter(cmd => cmd.startsWith(input));
                  if (matchingCommands.length === 1) setInput(matchingCommands[0] + ' ');
                }
              }}
              placeholder={isProcessing ? 'Processing...' : 'Send a message or type / for commands...'}
              className="chat-textarea w-full bg-input text-foreground rounded-lg pl-4 pr-12 py-3 resize-none min-h-[48px] max-h-[200px] border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all focus-glow" 
              disabled={isProcessing}
              rows={1}
            />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-accent rounded-lg transition-colors" title="AI Suggestions" aria-label="AI Suggestions"> <Sparkles className="w-5 h-5" /> </button>
          </div>
          <div className="flex gap-2">
              <button type="submit" disabled={!input.trim() || isProcessing} className="flex-none p-3 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent" aria-label="Send message"> <Send className="w-5 h-5" /> </button>
            {messages.length > 0 && ( <SaveChatButton messages={messages} /> )}
            {messages.length > 0 && ( <button type="button" className="flex-none p-3 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors" title="Share" aria-label="Share chat"> <Share2 className="w-5 h-5" /> </button> )}
          </div>
        </form>
        {input.startsWith('/') && !isProcessing && (
          <div className="max-w-4xl mx-auto mt-1">
            <div className="bg-card rounded-lg border border-border shadow-lg">
              <div className="p-2 border-b border-border"> <div className="text-xs text-muted-foreground">Commands</div> </div>
              <div className="max-h-48 overflow-y-auto">
                {[
                  { command: '/agent', description: 'Toggle agent mode or run agent commands' },
                  { command: '/sandbox', description: 'Toggle code sandbox or set sandbox language' },
                  { command: '/clear', description: 'Clear all messages in the current chat' },
                  { command: '/help', description: 'Show available commands and help' }
                ].map(item => (
                  <button key={item.command} className={`w-full text-left p-2 hover:bg-muted ${ input.split(' ')[0] === item.command ? 'bg-muted' : '' }`} onClick={() => setInput(item.command + ' ')}>
                    <div className="flex items-center"> <code className="bg-muted/50 px-1 py-0.5 rounded text-primary">{item.command}</code> <span className="ml-2 text-sm text-muted-foreground">{item.description}</span> </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.length === 0 && !showApiStatus && !showSandbox && !showAgentList && (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="flex justify-center flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center"> <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Tab</kbd> <span className="ml-1">Autocomplete commands</span> </div>
              <div className="flex items-center"> <kbd className="px-1 py-0.5 bg-muted rounded border border-border">/help</kbd> <span className="ml-1">Show all commands</span> </div>
              <div className="flex items-center"> <kbd className="px-1 py-0.5 bg-muted rounded border border-border">/agent</kbd> <span className="ml-1">Toggle agent mode</span> </div>
            </div>
          </div>
        )}
      </div>
      {!autoScroll && (
        <button onClick={() => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="fixed bottom-24 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors glow-primary"> ↓ New messages </button>
      )}
    </div>
  );
}

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.



New problems detected after saving the file:
src/components/Chat.tsx
- [ts Error] Line 1: Could not find a declaration file for module 'react'. '/home/braden/node_modules/react/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/react` if it exists or add a new declaration (.d.ts) file containing `declare module 'react';`
- [ts Error] Line 3: Module '"lucide-react"' has no exported member 'Send'. Did you mean to use 'import Send from "lucide-react"' instead?
- [ts Error] Line 9: Cannot find module 'framer-motion' or its corresponding type declarations.
- [ts Error] Line 21: Cannot find module 'react-markdown' or its corresponding type declarations.
- [ts Error] Line 428: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 428: Could not find a declaration file for module 'react/jsx-runtime'. '/home/braden/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/react` if it exists or add a new declaration (.d.ts) file containing `declare module 'react/jsx-runtime';`
- [ts Error] Line 431: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 432: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 434: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 434: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 436: Type '{ children: any[]; variant: string; className: string; }' is not assignable to type 'BadgeProps'.
  Property 'children' does not exist on type 'BadgeProps'.
- [ts Error] Line 440: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 451: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 454: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 460: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 461: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 462: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 462: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 463: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 465: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 466: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 473: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 484: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 486: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 487: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 488: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 493: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 495: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 496: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 501: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 502: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 503: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 508: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 509: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 510: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 511: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 513: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 513: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 514: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 515: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 520: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 521: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 524: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 525: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 525: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 526: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 528: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 530: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 539: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 540: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 540: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 541: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 541: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 542: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 543: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 545: Type '{ children: string; variant: string; className: string; }' is not assignable to type 'BadgeProps'.
  Property 'children' does not exist on type 'BadgeProps'.
- [ts Error] Line 547: Type '{ children: string; variant: string; className: string; }' is not assignable to type 'BadgeProps'.
  Property 'children' does not exist on type 'BadgeProps'.
- [ts Error] Line 549: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 550: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 552: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 555: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 556: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 556: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 556: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 556: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 557: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 558: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 559: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 564: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 565: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 566: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 566: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 574: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 589: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 603: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 605: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 607: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 609: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 611: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 613: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 616: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 618: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 620: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 622: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 632: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 634: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 637: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 638: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 638: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 639: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 639: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 640: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 642: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 646: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 647: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 649: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 650: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 652: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 653: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 655: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 656: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 657: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 658: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 659: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 666: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 676: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 676: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 678: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 679: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 680: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 685: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 686: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 688: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 689: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 689: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 690: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 692: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 702: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 704: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 705: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 707: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 708: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 710: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 711: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 719: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 724: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 725: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 727: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 728: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 730: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 731: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 739: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 744: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 745: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 746: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 750: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 752: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 764: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 766: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 773: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 776: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 777: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 789: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 790: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 791: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 793: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 794: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 819: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 826: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 827: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 829: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 830: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 837: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 844: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 851: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 853: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 854: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 858: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 859: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 860: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 861: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 861: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 862: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 863: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 870: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 877: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 878: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 878: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 879: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 879: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 880: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 881: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 883: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 884: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 885: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 890: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 891: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 892: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 893: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 893: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 894: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 894: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 895: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 896: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 897: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 897: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 898: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 898: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 899: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 900: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 901: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 901: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 902: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 902: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 903: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 904: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 905: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 907: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 910: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 918: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
- [ts Error] Line 920: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.<environment_details>
# VSCode Visible Files
src/components/Chat.tsx

# VSCode Open Tabs
tsconfig.node.json
src/lib/context/ContextEnhancer.ts
tsconfig.app.json
src/App.tsx
src/types/form-data.d.ts
src/types/lucide-react.d.ts
core/router.ts
src/components/Animation/AnimationScene.css
src/components/Animation/AnimationScene.tsx
src/components/Animation/Character.tsx
src/components/Animation/Environment.tsx
src/components/Animation/LightingEffects.css
src/components/Animation/LightingEffects.tsx
src/components/Animation/ParticleSystem.tsx
src/components/Animation/index.tsx
src/components/AnimationDemo.tsx
src/components/ApiStatusDisplay.tsx
src/components/Canvas.tsx
src/components/Chat.css
src/components/Chat.tsx

# Current Time
17/04/2025, 2:53:47 pm (Australia/Perth, UTC+8:00)

# Context Window Usage
473,871 / 1,048.576K tokens used (45%)

# Current Mode
ACT MODE
</environment_details>
