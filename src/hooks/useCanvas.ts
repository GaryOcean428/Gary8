import * as React from 'react';
import { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { AIDesigner } from '../lib/canvas/ai-designer';
import { CanvasManager } from '../lib/canvas/canvas-manager';
import { AgentRegistry } from '../lib/agents/core/agent-registry';
import { useToast } from './useToast';
import { useLoading } from './useLoading';

// Define a basic Agent type
export interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
}

export interface CanvasMode {
  mode: 'design' | 'sandbox' | 'tools' | 'agents' | 'mcp';
}

export function useCanvas(_canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<CanvasMode['mode']>('design');
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const { addToast } = useToast();
  const { setLoading } = useLoading();
  
  const aiDesigner = AIDesigner.getInstance();
  const canvasManager = CanvasManager.getInstance();
  const agentRegistry = AgentRegistry.getInstance();

  useEffect(() => {
    if (!_canvasRef.current) return;

    // Initialize canvas
    const fabricCanvas = new fabric.Canvas(_canvasRef.current, {
      width: window.innerWidth - 32,
      height: window.innerHeight - 32,
      backgroundColor: '#ffffff'
    });

    // Initialize canvas manager
    canvasManager.initialize(fabricCanvas);

    // Set up event listeners
    fabricCanvas.on('selection:created', (_e: fabric.IEvent<Event>) => {
      setSelectedObject(_e.selected?.[0] ?? null);
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
  }, [canvasManager, agentRegistry, addToast, _canvasRef]);

  const handlePromptSubmit = async (_prompt: string) => {
    if (!canvas) return;

    setIsGenerating(true);
    setLoading(true, 'Generating design...');

    try {
      await aiDesigner.generateDesign(_prompt, canvas);
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

  const handleToolChange = (_tool: string) => {
    if (!canvas) return;
    setSelectedTool(_tool);

    switch (_tool) {
      case 'select':
        canvas.isDrawingMode = false;
        break;
      case 'draw':
        canvas.isDrawingMode = true;
        break;
      default:
        canvas.isDrawingMode = false;
    }

    canvas.selection = _tool === 'select';
  };

  const handleShapeAdd = (_type: string) => {
    if (!canvas) return;

    let shape: fabric.Object;
    const center = {
      x: canvas.width! / 2,
      y: canvas.height! / 2
    };

    switch (_type) {
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

  const handlePropertyChange = (_property: string, _value: unknown) => {
    if (!canvas || !selectedObject) return;

    // Use type assertion to handle the property setting
    (selectedObject as any)[_property] = _value;
    canvas.renderAll();
  };

  const handleUndo = () => {
    canvasManager.undo();
  };

  const handleRedo = () => {
    canvasManager.redo();
  };

  const handleExport = async (_format: string) => {
    try {
      const code = canvasManager.exportToCode(_format as 'react' | 'html');
      await navigator.clipboard.writeText(code);
      addToast({
        type: 'success',
        message: 'Code copied to clipboard',
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to export code:", error);
      addToast({
        type: 'error',
        message: 'Failed to export code',
        duration: 5000
      });
    }
  };

  return {
    canvas,
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
  };
}
