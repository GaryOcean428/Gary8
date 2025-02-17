import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { thoughtLogger } from '@/lib/utils/logger';
import { useTheme } from '@/hooks/useTheme';

interface TerminalEmulatorProps {
  initialCommand?: string;
  onCommand?: (command: string) => Promise<void>;
  className?: string;
}

export function TerminalEmulator({
  initialCommand,
  onCommand,
  className
}: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal>();
  const { theme } = useTheme();
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: theme.code.background,
        foreground: theme.code.text,
        cursor: theme.code.text,
        selection: theme.code.keyword,
        black: theme.background,
        blue: theme.primary,
        cyan: theme.secondary,
        green: '#50fa7b',
        magenta: theme.accent,
        red: '#ff5555',
        white: theme.code.text,
        yellow: '#f1fa8c'
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block'
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('Welcome to Gary8 Terminal');
    term.writeln('Type "help" for available commands');
    term.write('\r\n$ ');

    let currentCommand = '';

    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) { // Enter
        term.write('\r\n');
        if (currentCommand.trim()) {
          executeCommand(currentCommand);
          setCommandHistory(prev => [...prev, currentCommand]);
          setHistoryIndex(-1);
        }
        currentCommand = '';
        term.write('$ ');
      } else if (domEvent.keyCode === 8) { // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          term.write('\b \b');
        }
      } else if (domEvent.keyCode === 38) { // Up arrow
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const command = commandHistory[commandHistory.length - 1 - newIndex];
          clearCurrentLine(term, currentCommand);
          currentCommand = command;
          term.write(command);
        }
      } else if (domEvent.keyCode === 40) { // Down arrow
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const command = commandHistory[commandHistory.length - 1 - newIndex];
          clearCurrentLine(term, currentCommand);
          currentCommand = command;
          term.write(command);
        }
      } else if (printable) {
        currentCommand += key;
        term.write(key);
      }
    });

    setTerminal(term);

    if (initialCommand) {
      executeCommand(initialCommand);
    }

    return () => {
      term.dispose();
    };
  }, [terminalRef.current]);

  const executeCommand = async (command: string) => {
    try {
      if (command === 'clear') {
        terminal?.clear();
        return;
      }

      if (command === 'help') {
        terminal?.writeln('\r\nAvailable commands:');
        terminal?.writeln('  clear - Clear terminal');
        terminal?.writeln('  help - Show this help message');
        terminal?.writeln('  history - Show command history');
        return;
      }

      if (command === 'history') {
        terminal?.writeln('\r\nCommand history:');
        commandHistory.forEach((cmd, i) => {
          terminal?.writeln(`  ${i + 1}  ${cmd}`);
        });
        return;
      }

      if (onCommand) {
        await onCommand(command);
      }
    } catch (error) {
      thoughtLogger.error('Command execution failed', { error, command });
      terminal?.writeln(`\r\nError: ${error.message}`);
    }
  };

  const clearCurrentLine = (term: Terminal, currentCommand: string) => {
    term.write('\r$ ' + ' '.repeat(currentCommand.length) + '\r$ ');
  };

  return (
    <div 
      ref={terminalRef}
      className={`min-h-[300px] bg-[${theme.code.background}] ${className}`}
    />
  );
} 
