import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { FabricCanvasManager } from '../lib/canvas/CanvasManager';
import { CanvasElement } from '../lib/canvas/types';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { useTheme } from '../providers/ThemeProvider';
import { Loader2 } from 'lucide-react';

export interface CanvasRef {
  addElement: (element: Partial<CanvasElement>) => Promise<void>;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => Promise<void>;
  executeCode: (code: string) => Promise<any>;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

interface CanvasProps {
  className?: string;
  onElementAdd?: (element: CanvasElement) => void;
  onElementRemove?: (id: string) => void;
  onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
  onCodeExecute?: (code: string) => Promise<any>;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  className = '',
  onElementAdd,
  onElementRemove,
  onElementUpdate,
  onCodeExecute
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<FabricCanvasManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { theme, isDarkMode } = useTheme();

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
  };

  useEffect(() => {
    if (canvasRef.current && !managerRef.current) {
      managerRef.current = new FabricCanvasManager(canvasRef.current);
      managerRef.current.initialize();
      
      managerRef.current.canvas.setBackgroundColor(theme.background, () => {
        managerRef.current?.canvas.renderAll();
      });
      
      setIsReady(true);
    }

    return () => {
      if (managerRef.current) {
        // Cleanup if needed
      }
    };
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (managerRef.current && canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          managerRef.current.canvas.setDimensions({
            width: parent.clientWidth,
            height: parent.clientHeight
          });
          managerRef.current.canvas.renderAll();
        }
      }
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.canvas.setBackgroundColor(theme.background, () => {
        managerRef.current?.canvas.renderAll();
      });
    }
  }, [isDarkMode, theme]);

  const handleUndo = () => {
    if (managerRef.current) {
      managerRef.current.undo();
      showFeedback('Action undone');
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
    }
  };

  const handleRedo = () => {
    if (managerRef.current) {
      managerRef.current.redo();
      showFeedback('Action redone');
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
    }
  };

  const handleZoomIn = () => {
    if (managerRef.current) {
      const newZoom = Math.min(zoom * 1.2, 5);
      setZoom(newZoom);
      managerRef.current.canvas.setZoom(newZoom);
      showFeedback(`Zoom: ${Math.round(newZoom * 100)}%`);
    }
  };

  const handleZoomOut = () => {
    if (managerRef.current) {
      const newZoom = Math.max(zoom / 1.2, 0.1);
      setZoom(newZoom);
      managerRef.current.canvas.setZoom(newZoom);
      showFeedback(`Zoom: ${Math.round(newZoom * 100)}%`);
    }
  };

  const handleClear = () => {
    if (managerRef.current) {
      managerRef.current.clear();
      showFeedback('Canvas cleared');
      setCanUndo(false);
      setCanRedo(false);
    }
  };

  useImperativeHandle(ref, () => ({
    addElement: async (element: Partial<CanvasElement>) => {
      if (!managerRef.current) return;
      await managerRef.current.addElement(element);
      onElementAdd?.(element as CanvasElement);
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
      showFeedback('Element added');
    },
    removeElement: (id: string) => {
      if (!managerRef.current) return;
      managerRef.current.removeElement(id);
      onElementRemove?.(id);
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
      showFeedback('Element removed');
    },
    updateElement: async (id: string, updates: Partial<CanvasElement>) => {
      if (!managerRef.current) return;
      await managerRef.current.updateElement(id, updates);
      onElementUpdate?.(id, updates);
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
      showFeedback('Element updated');
    },
    executeCode: async (code: string) => {
      if (!managerRef.current) return;
      try {
        const result = await managerRef.current.executeCode(code);
        onCodeExecute?.(code);
        setCanUndo(managerRef.current.canUndo());
        setCanRedo(managerRef.current.canRedo());
        showFeedback('Code executed successfully');
        return result;
      } catch (error) {
        showFeedback('Error executing code');
        throw error;
      }
    },
    undo: handleUndo,
    redo: handleRedo,
    clear: handleClear
  }), [onElementAdd, onElementRemove, onElementUpdate, onCodeExecute]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Canvas Toolbar */}
      <CanvasToolbar 
        className="absolute top-4 left-4 z-10"
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onClear={handleClear}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 transition-colors duration-200"
      />

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-foreground font-medium">
              Initializing canvas...
            </div>
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {feedback && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg transition-all duration-200 text-foreground">
          {feedback}
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export function useCanvas() {
  const canvasRef = useRef<CanvasRef>(null);
  return canvasRef;
}
