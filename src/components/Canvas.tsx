import * as React from 'react';
import { useRef } from 'react';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { CanvasProperties } from './canvas/CanvasProperties';
import { CanvasPrompt } from './canvas/CanvasPrompt';
import { CanvasSandbox } from './canvas/CanvasSandbox';
import { ToolManager } from './canvas/ToolManager';
import { CanvasAgentsList } from './canvas/CanvasAgentsList';
import { DynamicMCPLoader } from './canvas/DynamicMCPLoader';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { Brush, Code, Bot, Wrench, Cpu } from 'lucide-react';
import { useCanvas, CanvasMode } from '../hooks/useCanvas';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    selectedTool,
    selectedObject,
    isGenerating,
    mode,
    agents,
    setMode,
    handlePromptSubmit,
    handleToolChange,
    handleShapeAdd,
    handlePropertyChange,
    handleUndo,
    handleRedo,
    handleExport,
    addToast
  } = useCanvas(canvasRef);

  return (
    <div className="relative w-full h-full bg-card overflow-hidden flex flex-col">
      {/* Mode Tabs */}
      <div className="p-2 border-b border-border bg-muted/30">
        <Tabs value={mode} onValueChange={(_value: string) => setMode(_value as CanvasMode['mode'])}>
          <TabsList className="grid grid-cols-5 h-9">
            <TabsTrigger value="design" className="flex items-center gap-1">
              <Brush className="w-4 h-4" />
              <span className="hidden sm:inline">Design</span>
            </TabsTrigger>
            <TabsTrigger value="sandbox" className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Sandbox</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-1">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-1">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">MCP</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {mode === 'design' && (
          <>
            {/* AI Prompt */}
            <CanvasPrompt 
              onSubmit={handlePromptSubmit}
              isGenerating={isGenerating}
            />

            {/* Toolbar */}
            <CanvasToolbar
              selectedTool={selectedTool}
              onToolChange={handleToolChange}
              onShapeAdd={handleShapeAdd}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onExport={handleExport}
            />

            {/* Properties Panel */}
            <CanvasProperties
              selectedObject={selectedObject}
              onPropertyChange={handlePropertyChange}
            />

            {/* Canvas */}
            <div className="absolute inset-8">
              <canvas ref={canvasRef} />
            </div>
          </>
        )}
        
        {mode === 'sandbox' && (
          <div className="p-4">
            <CanvasSandbox
              initialCode=""
              height="calc(100vh - 120px)"
              onExecute={(_result) => {
                console.log('Sandbox execution result:', _result);
                addToast({
                  type: 'info',
                  message: 'Code executed. Check console for full results.',
                  duration: 3000
                });
              }}
            />
          </div>
        )}
        
        {mode === 'tools' && (
          <div className="p-4 h-full">
            <ToolManager />
          </div>
        )}
        
        {mode === 'agents' && (
          <CanvasAgentsList agents={agents} addToast={addToast} />
        )}
        
        {mode === 'mcp' && (
          <div className="p-4">
            <DynamicMCPLoader name="MCPConfig" />
          </div>
        )}
      </div>
    </div>
  );
}
