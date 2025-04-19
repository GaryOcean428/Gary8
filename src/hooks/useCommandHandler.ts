import { useState } from 'react';
import { useToast } from './useToast';
import { Agent } from '../types';
import { Message } from '../components/chat/ChatMessage';

interface CommandHandlerOptions {
  setInput: (value: string) => void;
  setIsAgentMode: (value: boolean) => void;
  setShowAgentList: (value: boolean) => void;
  setActiveAgent: (value: string | null) => void;
  addMessage: (message: Message | ((messages: Message[]) => Message[])) => Promise<void>;
  clearMessages: () => void;
  availableAgents: Agent[];
  setShowSandbox: (value: boolean) => void;
  setSandboxLanguage: (value: string) => void;
}

export function useCommandHandler({
  setInput,
  setIsAgentMode,
  setShowAgentList,
  setActiveAgent,
  addMessage,
  clearMessages,
  availableAgents,
  setShowSandbox,
  setSandboxLanguage
}: CommandHandlerOptions) {
  const { addToast } = useToast();

  const handleAgentCommand = (_args: string[]) => {
    if (_args.length === 0) {
      const nextIsAgentMode = true; // Toggle handled in parent component
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
      setShowSandbox(!true); // Toggle handled in parent component
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
    if (!_commandText.startsWith('/')) return false;
    
    const commandParts = _commandText.trim().split(' ');
    const command = commandParts[0].toLowerCase();
    const args = commandParts.slice(1);

    switch (command) {
      case '/agent': 
        handleAgentCommand(args); 
        break;
      case '/sandbox': 
        handleSandboxCommand(args); 
        break;
      case '/clear': 
        handleClearCommand(); 
        break;
      case '/help': 
        await handleHelpCommand(); 
        break;
      default: 
        await handleUnknownCommand(command); 
        break;
    }
    
    return true;
  };

  return {
    handleCommand
  };
}
