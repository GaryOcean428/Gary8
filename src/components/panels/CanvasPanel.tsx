import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { CanvasPrompt } from '../canvas/CanvasPrompt';
import { CanvasToolbar } from '../canvas/CanvasToolbar';
import { CanvasProperties } from '../canvas/CanvasProperties';
import { AIDesigner } from '../../lib/canvas/ai-designer';
import { CanvasManager } from '../../lib/canvas/canvas-manager';
import { useToast } from '../../hooks/useToast';

export function CanvasPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 300,
        height: window.innerHeight - 100,
        backgroundColor: '#ffffff'
      });

      canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
      canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
      canvas.on('selection:cleared', () => setSelectedObject(null));

      setFabricCanvas(canvas);
      CanvasManager.getInstance().initialize(canvas);

      const handleResize = () => {
        canvas.setDimensions({
          width: window.innerWidth - 300,
          height: window.innerHeight - 100
        });
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.dispose();
      };
    }
  }, [fabricCanvas]);

  const handlePromptSubmit = async (prompt: string) => {
    if (!fabricCanvas) return;
    
    setIsGenerating(true);
    try {
      await AIDesigner.getInstance().generateDesign(prompt, fabricCanvas);
      addToast({
        type: 'success',
        message: 'Design generated successfully'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to generate design',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShapeAdd = (type: string) => {
    if (!fabricCanvas) return;

    let shape: fabric.Object;
    const center = fabricCanvas.getCenter();

    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: center.left - 50,
          top: center.top - 25,
          width: 100,
          height: 50,
          fill: '#3B82F6',
          stroke: '#2563EB',
          strokeWidth: 1
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: center.left - 25,
          top: center.top - 25,
          radius: 25,
          fill: '#3B82F6',
          stroke: '#2563EB',
          strokeWidth: 1
        });
        break;
      case 'text':
        shape = new fabric.Text('Text', {
          left: center.left - 25,
          top: center.top - 12,
          fontSize: 24,
          fill: '#1F2937'
        });
        break;
      default:
        return;
    }

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.renderAll();
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedObject) return;

    selectedObject.set(property, value);
    fabricCanvas?.renderAll();
  };

  const handleUndo = () => {
    CanvasManager.getInstance().undo();
  };

  const handleRedo = () => {
    CanvasManager.getInstance().redo();
  };

  const handleExport = async (format: 'react' | 'html') => {
    try {
      const code = CanvasManager.getInstance().exportToCode(format);
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design.${format === 'react' ? 'tsx' : 'html'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `Design exported as ${format.toUpperCase()} successfully`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export failed',
        message: error instanceof Error ? error.message : 'Failed to export design'
      });
    }
  };

  return (
    <div className="relative flex-1 bg-gray-50">
      <CanvasPrompt onSubmit={handlePromptSubmit} isGenerating={isGenerating} />
      
      <CanvasToolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        onShapeAdd={handleShapeAdd}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
      />

      {selectedObject && (
        <CanvasProperties
          selectedObject={selectedObject}
          onPropertyChange={handlePropertyChange}
        />
      )}

      <canvas ref={canvasRef} className="absolute inset-0" />

      {isGenerating && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-900">Generating design...</p>
          </div>
        </div>
      )}
    </div>
  );
}