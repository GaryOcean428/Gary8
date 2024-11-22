import React, { useRef, useState } from 'react';
import { Canvas, CanvasRef } from './Canvas';
import { CanvasElement } from '../lib/canvas/types';
import { CanvasAgent } from '../lib/agents/CanvasAgent';
import { Square, Type, Code, Undo2, Redo2, Trash2, Send } from 'lucide-react';

export function CanvasTest() {
  const canvasRef = useRef<CanvasRef>(null);
  const agentRef = useRef<CanvasAgent>(new CanvasAgent());
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);

  React.useEffect(() => {
    if (canvasRef.current) {
      agentRef.current.setCanvas(canvasRef.current);
    }
  }, []);

  const handleAddShape = async () => {
    if (!canvasRef.current) return;
    await canvasRef.current.addElement({
      type: 'shape',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 100 },
      style: { fill: 'var(--primary)' }
    });
  };

  const handleAddText = async () => {
    if (!canvasRef.current) return;
    await canvasRef.current.addElement({
      type: 'text',
      position: { x: 100, y: 250 },
      data: { text: 'Hello Canvas!' },
      style: { 
        fill: 'var(--foreground)',
        fontSize: 24,
        fontFamily: 'system-ui'
      }
    });
  };

  const handleExecuteCode = async () => {
    if (!canvasRef.current) return;
    const code = `
      const circle = new fabric.Circle({
        radius: 50,
        fill: 'var(--secondary)',
        left: 200,
        top: 200
      });
      canvas.add(circle);
      canvas.renderAll();
    `;
    await canvasRef.current.executeCode(code);
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    try {
      const result = await agentRef.current.executeCommand(command);
      setOutput(prev => [...prev, `> ${command}`, result ? `Result: ${result}` : 'Command executed']);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setOutput(prev => [...prev, `> ${command}`, `Error: ${errorMessage}`]);
    }

    setCommand('');
  };

  const handleElementAdd = (element: CanvasElement) => {
    console.log('Element added:', element);
  };

  const handleElementRemove = (id: string) => {
    console.log('Element removed:', id);
  };

  const handleElementUpdate = (id: string, updates: Partial<CanvasElement>) => {
    console.log('Element updated:', id, updates);
  };

  const handleCodeExecute = async (code: string) => {
    console.log('Code executed:', code);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-3 p-4 border-b border-border bg-muted/30">
        <button
          onClick={handleAddShape}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm hover:shadow"
        >
          <Square className="w-4 h-4" />
          Add Shape
        </button>
        <button
          onClick={handleAddText}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm hover:shadow"
        >
          <Type className="w-4 h-4" />
          Add Text
        </button>
        <button
          onClick={handleExecuteCode}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm hover:shadow"
        >
          <Code className="w-4 h-4" />
          Execute Code
        </button>
        <div className="h-6 w-px bg-border mx-2" />
        <button
          onClick={() => canvasRef.current?.undo()}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all shadow-sm hover:shadow"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={() => canvasRef.current?.redo()}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all shadow-sm hover:shadow"
        >
          <Redo2 className="w-4 h-4" />
          Redo
        </button>
        <button
          onClick={() => canvasRef.current?.clear()}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all shadow-sm hover:shadow"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>
      
      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg border border-border overflow-hidden shadow-sm">
            <Canvas
              ref={canvasRef}
              onElementAdd={handleElementAdd}
              onElementRemove={handleElementRemove}
              onElementUpdate={handleElementUpdate}
              onCodeExecute={handleCodeExecute}
            />
          </div>
        </div>

        {/* Agent Interaction Panel */}
        <div className="w-96 border-l border-border bg-muted/30 flex flex-col">
          <div className="p-4 border-b border-border bg-background">
            <h3 className="font-semibold mb-3 text-foreground">Agent Commands</h3>
            <form onSubmit={handleCommandSubmit} className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>

          {/* Command Output */}
          <div className="flex-1 p-4 overflow-auto font-mono text-sm bg-background/50">
            {output.map((line, i) => (
              <div
                key={i}
                className={`mb-1 ${line.startsWith('>') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Example Commands */}
          <div className="p-4 border-t border-border bg-background">
            <h4 className="font-semibold mb-2 text-foreground">Example Commands:</h4>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer transition-colors">create circle</li>
              <li className="hover:text-foreground cursor-pointer transition-colors">create rectangle</li>
              <li className="hover:text-foreground cursor-pointer transition-colors">create text "Hello World"</li>
              <li className="hover:text-foreground cursor-pointer transition-colors">clear</li>
              <li className="hover:text-foreground cursor-pointer transition-colors">undo</li>
              <li className="hover:text-foreground cursor-pointer transition-colors">redo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
