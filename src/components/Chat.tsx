import React, { useState, useRef, useEffect } from 'react';
// Removed duplicate/unused: ChevronDown, Search. Combined imports.
import { Pause, Play, Sparkles, RotateCcw, Share2, Filter, Hash, Send, User, Terminal, X, Bot } from 'lucide-react';
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

// Use the same type as defined in LoadingIndicator
import { ProcessingState } from './LoadingIndicator';
type ProcessingPhase = ProcessingState;

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

  const handleModelChange = (_model: string) => {
    setFilters(_prev => ({ ..._prev, _model }));
    setShowFilterMenu(false);
  };

  const toggleFilter = (_key: 'searchEnabled' | 'streamingEnabled') => {
    setFilters(_prev => ({ ..._prev, [_key]: !_prev[_key] }));
  };

  const updateProcessingPhase = (_state?: string) => {
    if (!_state) return;
    
    switch (_state) {
      case 'searching': setProcessingPhase('searching'); break;
      case 'retrieving': setProcessingPhase('retrieving'); break;
      case 'processing': setProcessingPhase('analyzing'); break; // Map 'processing' to 'analyzing'
      case 'thinking': setProcessingPhase('thinking'); break;
      case 'reasoning': setProcessingPhase('reasoning'); break;
      default: setProcessingPhase('generating');
    }
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
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
        (_contentChunk) => { // Renamed for clarity
          if (!isPaused) {
            currentContent += _contentChunk;
            chunkCount++;
            
            // Update the existing assistant message content
            addMessage((_currentMessages: Message[]) => { 
              return _currentMessages.map((_msg: Message) => 
                _msg.id === assistantMessage.id
                  ? { ..._msg, content: currentContent }
                  : _msg
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

  const handleAgentCommand = (_args: string[]) => {
    if (_args.length === 0) {
      const nextIsAgentMode = !isAgentMode;
      setIsAgentMode(nextIsAgentMode);
      setInput('');
      addToast({ type: 'info', message: `Agent mode ${nextIsAgentMode ? 'enabled' : 'disabled'}`, duration: 3000 });
      setShowAgentList(nextIsAgentMode);
      if (!nextIsAgentMode) setActiveAgent(null);
      return;
    }

    const agentAction = _args[0]?.toLowerCase();
    if (agentAction === 'list') {
      setShowAgentList(true);
      setInput('');
    } else if (agentAction === 'activate' && _args[1]) {
      const agentName = _args.slice(1).join(' ');
      const agent = availableAgents.find((_a: Agent) => _a.name.toLowerCase() === agentName.toLowerCase());
      if (agent) {
        setActiveAgent(agent.id);
        setIsAgentMode(true);
        setInput('');
        addToast({ type: 'success', message: `Activated agent: ${agent.name}`, duration: 3000 });
      } else {
        addToast({ type: 'error', message: `Agent not found: ${agentName}`, duration: 3000 });
      }
    } else {
       addToast({ type: 'info', message: 'Invalid agent command. Use /agent list or /agent activate [name].' });
    }
  };

  const handleSandboxCommand = (_args: string[]) => {
    if (_args.length === 0) {
      setShowSandbox(!showSandbox);
      setInput('');
      return;
    }
    
    if (_args[0]?.toLowerCase() === 'language' && _args[1]) {
      const language = _args[1].toLowerCase();
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
       addToast({ type: 'info', message: 'Invalid sandbox command. Use /sandbox language [lang].' });
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

  const handleUnknownCommand = async (_command: string) => {
     await addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Unknown command: ${_command}\nType \`/help\` to see available commands.`,
        timestamp: Date.now()
      });
      setInput('');
  };

  const handleCommand = async (_commandText: string) => {
    const commandParts = _commandText.trim().split(' ');
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

  const activateAgent = (_agentId: string) => {
    setActiveAgent(_agentId);
    setShowAgentList(false);
    const agent = availableAgents.find((_a: Agent) => _a.id === _agentId);
    if (agent) {
      addToast({ type: 'success', message: `Activated agent: ${agent.name}`, duration: 3000 });
    }
  };

  // Helper to render message bubble classes
  const getBubbleClasses = (_role: Message['role']) => {
    if (_role === 'user') return 'bg-secondary/90 text-secondary-foreground rounded-l-lg rounded-tr-lg card-elevated';
    if (_role === 'system') return 'bg-destructive/90 text-destructive-foreground rounded-lg card-elevated glow-destructive';
    return 'bg-card/90 text-card-foreground rounded-r-lg rounded-tl-lg card-elevated';
  };

  // Helper to render message role icon and name
  const renderRoleInfo = (_role: Message['role']) => {
    if (_role === 'user') {
      return <div className="flex items-center text-xs text-secondary-foreground/70"><User className="w-3 h-3 mr-1" /> User</div>;
    }
    if (_role === 'system') {
      return <div className="flex items-center text-xs text-destructive-foreground/70"><Terminal className="w-3 h-3 mr-1" /> System</div>;
    }
    if (activeAgent) {
      const agentName = availableAgents.find((_a: Agent) => _a.id === activeAgent)?.name ?? 'Assistant';
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
                {availableAgents.find((_a: Agent) => _a.id === activeAgent)?.name ?? 'Unknown Agent'} {/* Use ?? */}
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
                ].map((_suggestion, _i) => (
                  <button
                    key={_i}
                    className="p-3 text-left rounded-lg bg-muted hover:bg-accent/20 transition-colors"
                    onClick={() => { setInput(_suggestion); textareaRef.current?.focus(); }}
                  >
                    {_suggestion}
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
                  {availableAgents.map((_agent: Agent) => (
                    <button
                      key={_agent.id}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${ activeAgent === _agent.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted' }`}
                      onClick={() => activateAgent(_agent.id)}
                    >
                      <div> <div className="font-medium">{_agent.name}</div> <div className="text-xs opacity-80">Role: {_agent.role}</div> </div>
                      <div> {_agent.capabilities.includes('mcp') ? <Badge variant="secondary" className="text-xs">MCP</Badge> : <Badge variant="outline" className="text-xs">Standard</Badge>} </div>
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
              onExecute={_result => { addMessage({ id: crypto.randomUUID(), role: 'system', content: `**Sandbox Result:**\n\`\`\`\n${_result}\n\`\`\``, timestamp: Date.now() }); }}
            />
          </div>
        )}

        {messages.map((_message: Message) => (
          <motion.div
            key={_message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${_message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {(() => {
              const bubbleClass = getBubbleClasses(_message.role);
              const streamingClass = (_message.role === 'assistant' && _message.content === '' && isProcessing) ? `streaming-cursor streaming-cursor-${processingPhase}` : '';
              return (
                <div className={`max-w-[95%] sm:max-w-[80%] rounded-lg p-4 shadow-lg backdrop-blur-sm ${bubbleClass} ${streamingClass}`}>
                  {renderRoleInfo(_message.role)}
                  {_message.role === 'assistant' && _message.content.length > 0 ? (
                    <ProgressiveMessage content={_message.content} isLoading={isProcessing && _message.content === ''} streamingPhase={processingPhase} className="prose prose-invert max-w-none break-words" />
                  ) : (
                    <div className="prose prose-invert max-w-none break-words"> <ReactMarkdown>{String(_message.content ?? '')}</ReactMarkdown> </div>
                  )}
                  {_message.model && (
                    <div className="mt-2 text-xs text-muted-foreground flex gap-1 items-center"> <span className="badge badge-primary">{_message.model}</span> <span className="text-muted-foreground">{new Date(_message.timestamp).toLocaleTimeString()}</span> </div>
                  )}
                </div>
              );
            })()} 
          </motion.div>
        ))}
        {isProcessing && !messages.some((_m: Message) => _m.role === 'assistant' && _m.content === '') && (
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
                          {['auto', 'grok', 'claude', 'openai', 'groq'].map(_model => (
                            <button key={_model} type="button" onClick={() => handleModelChange(_model)} className={`px-2 py-1 text-xs rounded-full ${ filters.model === _model ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80' }`}> {_model.charAt(0).toUpperCase() + _model.slice(1)} </button>
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
              onChange={(_e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(_e.target.value)}
              onKeyDown={(_e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (_e.key === 'Enter' && !_e.shiftKey) { _e.preventDefault(); handleSubmit(_e); }
                if (_e.key === 'Tab' && input.startsWith('/') && !input.includes(' ')) {
                  _e.preventDefault();
                  const commands = ['/agent', '/sandbox', '/clear', '/help'];
                  const matchingCommands = commands.filter(_cmd => _cmd.startsWith(input));
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
                ].map(_item => (
                  <button key={_item.command} className={`w-full text-left p-2 hover:bg-muted ${ input.split(' ')[0] === _item.command ? 'bg-muted' : '' }`} onClick={() => setInput(_item.command + ' ')}>
                    <div className="flex items-center"> <code className="bg-muted/50 px-1 py-0.5 rounded text-primary">{_item.command}</code> <span className="ml-2 text-sm text-muted-foreground">{_item.description}</span> </div>
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
