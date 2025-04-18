import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { CanvasProperties } from './canvas/CanvasProperties';
import { CanvasPrompt } from './canvas/CanvasPrompt';
import { AIDesigner } from '../lib/canvas/ai-designer';
import { CanvasManager } from '../lib/canvas/canvas-manager';
import { useToast } from '../hooks/useToast';
import { useLoading } from '../hooks/useLoading';
import { CanvasSandbox } from './canvas/CanvasSandbox';
import { ToolManager } from './canvas/ToolManager';
import { AgentRegistry } from '../lib/agents/core/agent-registry';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs'; // Removed TabsContent
import { Button } from './ui/Button';
import { Brush, Code, Bot, Wrench, Cpu } from 'lucide-react'; // Removed PenTool, reverted alias

// Define a basic Agent type (replace with actual import if available)
interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
}

export interface CanvasMode {
  mode: 'design' | 'sandbox' | 'tools' | 'agents' | 'mcp';
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<CanvasMode['mode']>('design');
  // Code sandbox state
  const [sandboxCode] = useState(''); // initial code for sandbox
  const [agents, setAgents] = useState<Agent[]>([]);
  const { addToast } = useToast();
  const { setLoading } = useLoading();
  
  const aiDesigner = AIDesigner.getInstance();
  const canvasManager = CanvasManager.getInstance();
  const agentRegistry = AgentRegistry.getInstance();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 32,
      height: window.innerHeight - 32,
      backgroundColor: '#ffffff'
    });

    // Initialize canvas manager
    canvasManager.initialize(fabricCanvas);

    // Set up event listeners
    fabricCanvas.on('selection:created', (e: fabric.IEvent<Event>) => { // Add type for e
      setSelectedObject(e.selected?.[0] ?? null); // Use ??
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    fabricCanvas.on('object:modified', () => {
      addToast({
        type: 'success',
        message: 'Changes saved',
        duration: 2000
      });
    });

    // Handle window resize
    const handleResize = () => {
      fabricCanvas.setDimensions({
        width: window.innerWidth - 32,
        height: window.innerHeight - 32
      });
    };
    window.addEventListener('resize', handleResize);

    setCanvas(fabricCanvas);

    // Get available agents
    setAgents(agentRegistry.getAllAgents());
    
    // Add listener for agent registry changes
    const handleAgentUpdate = () => {
      setAgents(agentRegistry.getAllAgents());
    };
    
    agentRegistry.on('agent-added', handleAgentUpdate);
    agentRegistry.on('agent-removed', handleAgentUpdate);

    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('resize', handleResize);
      agentRegistry.off('agent-added', handleAgentUpdate);
      agentRegistry.off('agent-removed', handleAgentUpdate);
    };
  }, [canvasManager, agentRegistry, addToast]);

  const handlePromptSubmit = async (prompt: string) => {
    if (!canvas) return;

    setIsGenerating(true);
    setLoading(true, 'Generating design...');

    try {
      await aiDesigner.generateDesign(prompt, canvas);
      addToast({
        type: 'success',
        message: 'Design generated successfully',
        duration: 3000
      });
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate design',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleToolChange = (tool: string) => {
    if (!canvas) return;
    setSelectedTool(tool);

    switch (tool) {
      case 'select':
        canvas.isDrawingMode = false;
        break;
      case 'draw':
        canvas.isDrawingMode = true;
        break;
      default:
        canvas.isDrawingMode = false;
    }

    canvas.selection = tool === 'select';
  };

  const handleShapeAdd = (type: string) => {
    if (!canvas) return;

    let shape: fabric.Object;
    const center = {
      x: canvas.width! / 2,
      y: canvas.height! / 2
    };

    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: center.x - 50,
          top: center.y - 25,
          width: 100,
          height: 50,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: center.x - 25,
          top: center.y - 25,
          radius: 25,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1
        });
        break;
      case 'text':
        shape = new fabric.IText('Double click to edit', {
          left: center.x - 50,
          top: center.y - 10,
          fontSize: 16,
          fill: '#000000'
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const handlePropertyChange = (property: string, value: unknown) => {
    if (!canvas || !selectedObject) return;

    selectedObject.set(property, value);
    canvas.renderAll();
  };

  const handleUndo = () => {
    canvasManager.undo();
  };

  const handleRedo = () => {
    canvasManager.redo();
  };

  const handleExport = async (format: string) => {
    try {
      const code = canvasManager.exportToCode(format as 'react' | 'html');
      await navigator.clipboard.writeText(code);
      addToast({
        type: 'success',
        message: 'Code copied to clipboard',
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to export code:", error); // Log error
      addToast({
        type: 'error',
        message: 'Failed to export code',
        duration: 5000
      });
    }
  };

  // Removed unused function handleSandboxCodeChange
  // const handleSandboxCodeChange = (code: string) => {
  //   setSandboxCode(code);
  // };

  // Removed unused function executeToolFromCanvas
  // const executeToolFromCanvas = (tool: Tool) => { ... };

  return (
    <div className="relative w-full h-full bg-card overflow-hidden flex flex-col">
      {/* Mode Tabs */}
      <div className="p-2 border-b border-border bg-muted/30">
        <Tabs value={mode} onValueChange={(value: string) => setMode(value as CanvasMode['mode'])}> {/* Add type for value */}
          <TabsList className="grid grid-cols-5 h-9">
            <TabsTrigger value="design" className="flex items-center gap-1">
              <Brush className="w-4 h-4" /> {/* Use original name */}
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
              initialCode={sandboxCode}
              // language={sandboxLanguage} // Removed unused prop
              height="calc(100vh - 120px)"
              onExecute={(result) => {
                console.log('Sandbox execution result:', result);
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
          <div className="p-4">
            <div className="bg-card rounded-lg border border-border shadow-md p-4">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Bot className="mr-2 h-5 w-5 text-primary" />
                Available Agents
              </h2>
              
              {agents.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-muted-foreground opacity-20 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Agents Available</p>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Agents haven't been registered yet. Check back later or create a new agent.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                  >
                    Create New Agent
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {agents.map((agent: Agent) => ( // Add Agent type
                    <div key={agent.id} className="bg-card/80 border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{agent.name}</h3>
                          <p className="text-muted-foreground text-sm">Role: {agent.role}</p>
                        </div>
                        <div className="flex space-x-1">
                          {agent.capabilities.includes('mcp') && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 flex items-center">
                              <Cpu className="h-3 w-3 mr-1" />
                              MCP
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.map((capability: string) => (
                            <span 
                              key={capability} 
                              className="px-2 py-0.5 bg-muted text-xs rounded-full"
                            >
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.location.hash = '#';  // Navigate to chat
                            addToast({
                              type: 'info',
                              message: `Switch to chat and use /agent activate ${agent.name}`,
                              duration: 5000
                            });
                          }}
                        >
                          Use in Chat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {mode === 'mcp' && (
          <div className="p-4">
            <DynamicImport name="MCPConfig" />
          </div>
        )}
      </div>
    </div>
  );
}

// This is a component that will be replaced with the actual component when it loads
function DynamicImport({ name }: Readonly<{ name: string }>) { // Mark props as read-only
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamic import of the component
    // Fix the import to include a file extension for Vite to analyze it properly
    import(`../components/mcp/${name}.tsx`).then(
      module => {
        setComponent(() => module[name]);
      }
    ).catch(error => {
      console.error(`Failed to load ${name}:`, error);
    });
  }, [name]);

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Component />;
}
