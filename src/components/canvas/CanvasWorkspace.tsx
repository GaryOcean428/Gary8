import { useEffect, useRef } from 'react';
import { CanvasManager } from '@/lib/canvas/canvas-manager';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasMinimap } from './CanvasMinimap';
import { useTheme } from '@/hooks/useTheme';

export function CanvasWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<CanvasManager>();
  const { theme } = useTheme();

  useEffect(() => {
    if (canvasRef.current && !managerRef.current) {
      managerRef.current = new CanvasManager(canvasRef.current.id);
      initializeCanvas();
    }
  }, []);

  async function initializeCanvas() {
    if (!managerRef.current) return;

    try {
      await managerRef.current.initialize();
      setupEventListeners();
      applyTheme();
    } catch (error) {
      console.error('Failed to initialize canvas:', error);
    }
  }

  function setupEventListeners() {
    if (!managerRef.current) return;

    // Canvas event listeners
    managerRef.current.canvas.on('object:modified', handleObjectModified);
    managerRef.current.canvas.on('selection:created', handleSelectionCreated);
    managerRef.current.canvas.on('selection:cleared', handleSelectionCleared);

    // Keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!managerRef.current) return;

    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'z':
          if (e.shiftKey) {
            managerRef.current.redo();
          } else {
            managerRef.current.undo();
          }
          e.preventDefault();
          break;
        // Add more shortcuts
      }
    }
  }

  return (
    <div className="relative w-full h-full bg-background">
      <CanvasToolbar manager={managerRef.current} />
      
      <div className="absolute inset-0 m-4">
        <canvas
          ref={canvasRef}
          id="main-canvas"
          className="w-full h-full"
        />
      </div>

      <CanvasMinimap
        manager={managerRef.current}
        className="absolute bottom-4 right-4"
      />
    </div>
  );
} 