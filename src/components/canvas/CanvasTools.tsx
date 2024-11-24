import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Move,
  Hand,
  Pencil,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save,
  Download
} from 'lucide-react';

interface CanvasToolsProps {
  onToolChange: (tool: string) => void;
  onZoom: (direction: 'in' | 'out') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentTool: string;
  zoom: number;
}

export function CanvasTools({
  onToolChange,
  onZoom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentTool,
  zoom
}: CanvasToolsProps) {
  const [strokeWidth, setStrokeWidth] = useState('2');
  const [strokeColor, setStrokeColor] = useState('#000000');

  const tools = [
    { id: 'select', icon: Move, label: 'Select' },
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'erase', icon: Eraser, label: 'Erase' },
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-lg">
      <div className="flex items-center gap-1 border-r pr-2">
        {tools.map((tool) => (
          <Tooltip key={tool.id} content={tool.label}>
            <Button
              variant={currentTool === tool.id ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange(tool.id)}
              aria-label={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </Tooltip>
        ))}
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
        <div className="flex flex-col">
          <label id="stroke-width-label" className="sr-only">Stroke Width</label>
          <Select
            value={strokeWidth}
            onValueChange={setStrokeWidth}
            aria-labelledby="stroke-width-label"
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Width" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1px</SelectItem>
              <SelectItem value="2">2px</SelectItem>
              <SelectItem value="4">4px</SelectItem>
              <SelectItem value="8">8px</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="stroke-color" className="sr-only">Stroke Color</label>
          <input
            id="stroke-color"
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            aria-label="Choose stroke color"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
        <Tooltip content="Undo">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Redo">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
        <Tooltip content="Zoom In">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoom('in')}
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </Tooltip>
        <span className="text-sm font-mono w-16 text-center" aria-label="Zoom Level">
          {Math.round(zoom * 100)}%
        </span>
        <Tooltip content="Zoom Out">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoom('out')}
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip content="Save">
          <Button variant="ghost" size="icon" aria-label="Save">
            <Save className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Export">
          <Button variant="ghost" size="icon" aria-label="Export">
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
