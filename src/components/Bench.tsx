import { useRef } from 'react';
import { BenchToolbar } from './bench/BenchToolbar';
import { BenchProperties } from './bench/BenchProperties';
import { BenchPrompt } from './bench/BenchPrompt';
import { BenchSandbox } from './bench/BenchSandbox';
import { ToolManager } from './canvas/ToolManager';  // Renamed temporarily - will be migrated to BenchToolManager
import { BenchAgentsList } from './bench/BenchAgentsList';
import { DynamicMCPLoader } from './bench/DynamicMCPLoader';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
// Using individual imports instead of named imports for icons
import { Brush, Code, Bot, Wrench, Cpu } from 'lucide-react';
// Import GitMerge separately to avoid TS error
import GitMerge from 'lucide-react/dist/esm/icons/git-merge';
import { useCanvas as useBench, CanvasMode as BenchMode } from '../hooks/useCanvas';  // Will be migrated to dedicated useBench hook in next phase

// Extended mode type to include workflow
type ExtendedBenchMode = BenchMode['mode'] | 'workflow';

export function Bench() {
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
  } = useBench(canvasRef);

  // Safe mode that includes 'workflow'
  const extendedMode = mode as ExtendedBenchMode;

  return (
    <div className="relative w-full h-full bg-card overflow-hidden flex flex-col">
      {/* Mode Tabs */}
      <div className="p-2 border-b border-border bg-muted/30">
        <Tabs value={mode} onValueChange={(_value: string) => setMode(_value as BenchMode['mode'])}>
          <TabsList className="grid grid-cols-6 h-9">
            <TabsTrigger value="design" className="flex items-center gap-1">
              <Brush className="w-4 h-4" />
              <span className="hidden sm:inline">Design</span>
            </TabsTrigger>
            <TabsTrigger value="sandbox" className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Sandbox</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-1">
              <GitMerge className="w-4 h-4" />
              <span className="hidden sm:inline">Workflow</span>
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
            <BenchPrompt 
              onSubmit={handlePromptSubmit}
              isGenerating={isGenerating}
            />

            {/* Toolbar */}
            <BenchToolbar
              selectedTool={selectedTool}
              onToolChange={handleToolChange}
              onShapeAdd={handleShapeAdd}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onExport={handleExport}
            />

            {/* Properties Panel */}
            <BenchProperties
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
            <BenchSandbox
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

        {extendedMode === 'workflow' && (
          <div className="p-4">
            {/* BenchWorkflow implementation scheduled for Phase 2, with interactive mermaid diagrams */}
            <div className="bg-card rounded-lg border border-border shadow-md p-6 text-center">
              <GitMerge className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-2">Workflow Visualization</h2>
              <p className="text-muted-foreground mb-4">
                Create interactive workflows, track progress, and visualize your development process
              </p>
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <pre className="text-sm text-left">
                  {`graph TD
    A[Start Project] -->|Initialize| B(Setup Environment)
    B --> C{Choose Framework}
    C -->|React| D[Frontend Setup]
    C -->|Node.js| E[Backend Setup]
    D --> F[Deploy Application]
    E --> F
    
    class B,D,E done;
    class F inprogress;`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Interactive mermaid diagram - drag nodes to reposition in full implementation
                </p>
              </div>
            </div>
          </div>
        )}
        
        {mode === 'tools' && (
          <div className="p-4 h-full">
            <ToolManager />
          </div>
        )}
        
        {mode === 'agents' && (
          <BenchAgentsList agents={agents} addToast={addToast} />
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
