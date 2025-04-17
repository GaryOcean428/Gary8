import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Play, Download, Copy, Check, X, Terminal, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../shared/hooks/useToast';

interface CanvasSandboxProps {
  initialCode?: string;
  language?: string;
  onExecute?: (result: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function CanvasSandbox({
  initialCode = '',
  language = 'javascript',
  onExecute,
  height = '400px',
  readOnly = false
}: CanvasSandboxProps) {
  const [code, setCode] = useState(initialCode || getDefaultCode(language));
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const sandboxRef = useRef<HTMLIFrameElement>(null);
  const { addToast } = useToast();

  // Set up the sandbox iframe
  useEffect(() => {
    // Configure sandbox iframe with appropriate content security policy
    if (sandboxRef.current) {
      // In a real implementation, this would set up secure communication with the iframe
    }
  }, []);

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  const handleExecute = () => {
    setIsExecuting(true);
    setIsError(false);
    setOutput('');
    
    // Simulate execution with a timeout
    setTimeout(() => {
      try {
        // In a real implementation, this would execute code in the sandbox iframe
        // For demonstration, we'll simulate execution with a simple evaluation
        const result = simulateExecution(code, language);
        setOutput(result);
        
        if (onExecute) {
          onExecute(result);
        }
        
        setIsError(false);
        addToast({
          type: 'success',
          message: 'Code executed successfully',
          duration: 3000
        });
        
        // Show the output tab
        setActiveTab('output');
      } catch (error) {
        setOutput(`Error: ${error instanceof Error ? error.message : 'An error occurred during execution'}`);
        setIsError(true);
        addToast({
          type: 'error',
          message: 'Error executing code',
          duration: 3000
        });
      } finally {
        setIsExecuting(false);
      }
    }, 1000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    addToast({
      type: 'success',
      message: 'Code copied to clipboard',
      duration: 2000
    });
  };

  const handleDownload = () => {
    const fileExtension = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addToast({
      type: 'success',
      message: `Code downloaded as code.${fileExtension}`,
      duration: 3000
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-md overflow-hidden flex flex-col" style={{ height }}>
      {/* Toolbar */}
      <div className="bg-muted/50 p-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <FileCode className="h-4 w-4 mr-2 text-primary" />
          <span className="text-sm font-medium">Code Sandbox ({language})</span>
          <Badge variant="outline" className="ml-2 text-xs">
            Secure Environment
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-muted rounded-md overflow-hidden">
            <Button 
              variant={activeTab === 'editor' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none px-3 py-1 h-auto text-xs"
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </Button>
            <Button
              variant={activeTab === 'output' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none px-3 py-1 h-auto text-xs"
              onClick={() => setActiveTab('output')}
            >
              Output
              {output && !isExecuting && (
                <Badge 
                  variant={isError ? "destructive" : "success"} 
                  className="ml-2 text-[10px] h-4"
                >
                  {isError ? <X className="h-2 w-2" /> : <Check className="h-2 w-2" />}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'editor' ? (
          // Editor
          <div className="flex-1 overflow-auto bg-card relative">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full resize-none p-4 font-mono text-sm bg-transparent focus:outline-none"
              spellCheck="false"
              readOnly={readOnly || isExecuting}
            />
            
            {/* Language badge */}
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="text-xs">
                {language}
              </Badge>
            </div>
          </div>
        ) : (
          // Output
          <div className="flex-1 overflow-auto p-4 font-mono text-sm relative bg-muted/20">
            {output ? (
              <pre className={`whitespace-pre-wrap ${isError ? 'text-destructive' : ''}`}>
                {output}
              </pre>
            ) : isExecuting ? (
              <div className="flex items-center text-muted-foreground">
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Executing code...
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <Terminal className="h-12 w-12 mb-2 opacity-30" />
                <p>No output yet. Run your code to see results here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-muted/50 p-2 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1 text-warning" />
          Secure execution with limited resources
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={handleCopyCode}
          >
            {isCopied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            variant="default"
            size="sm"
            leftIcon={isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            onClick={handleExecute}
            disabled={isExecuting || readOnly}
          >
            {isExecuting ? 'Running...' : 'Run Code'}
          </Button>
        </div>
      </div>
      
      {/* Hidden sandbox iframe */}
      <iframe
        ref={sandboxRef}
        title="Code Execution Sandbox"
        sandbox="allow-scripts"
        style={{ display: 'none' }}
      />
    </div>
  );
}

function getDefaultCode(language: string): string {
  switch (language.toLowerCase()) {
    case 'javascript':
      return `// Write your JavaScript code here
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Example usage
console.log(greet('world'));
`;
    case 'python':
      return `# Write your Python code here
def greet(name):
    return f"Hello, {name}!"

# Example usage
print(greet("world"))
`;
    case 'html':
      return `<!DOCTYPE html>
<html>
<head>
  <title>Canvas Sandbox</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
  </style>
</head>
<body>
  <h1>Hello, Canvas!</h1>
  <p>Edit this HTML to create your own content.</p>
</body>
</html>
`;
    default:
      return `// Write your ${language} code here
`;
  }
}

function getFileExtension(language: string): string {
  switch (language.toLowerCase()) {
    case 'javascript':
      return 'js';
    case 'typescript':
      return 'ts';
    case 'python':
      return 'py';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'java':
      return 'java';
    case 'c#':
    case 'csharp':
      return 'cs';
    case 'c++':
    case 'cpp':
      return 'cpp';
    case 'go':
      return 'go';
    case 'rust':
      return 'rs';
    default:
      return 'txt';
  }
}

function simulateExecution(code: string, language: string): string {
  // In a real implementation, this would execute code in a secure sandbox
  // For demonstration purposes, we'll just return some simulated output
  
  if (!code.trim()) {
    return 'No code to execute';
  }
  
  // Simulate errors occasionally
  if (Math.random() < 0.1) {
    throw new Error('Simulated execution error');
  }
  
  switch (language.toLowerCase()) {
    case 'javascript':
      return `> Running JavaScript code...
> Output:
Hello, world!

> Execution completed successfully in 0.12s`;
    
    case 'python':
      return `>>> Running Python code...
>>> Output:
Hello, world!

>>> Execution completed successfully in 0.08s`;
    
    case 'html':
      return `Rendered HTML successfully.
Preview available in HTML view.`;
    
    default:
      return `Running ${language} code...
Output:
Hello, world!

Execution completed successfully in 0.10s`;
  }
}