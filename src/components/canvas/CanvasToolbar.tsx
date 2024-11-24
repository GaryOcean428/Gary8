import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  Share,
  Settings,
  Trash
} from 'lucide-react';

interface CanvasToolbarProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onClear?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CanvasToolbar({
  className = '',
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onSave,
  onExport,
  onShare,
  onSettings,
  onClear,
  canUndo = false,
  canRedo = false,
}: CanvasToolbarProps) {
  const { theme } = useTheme();

  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    disabled = false,
    title
  }: { 
    icon: React.ElementType;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-muted active:bg-muted/80 text-foreground hover:text-primary'}
      `}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm ${className}`}
    >
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <ToolbarButton 
          icon={Undo} 
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)" 
        />
        <ToolbarButton 
          icon={Redo} 
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)" 
        />
      </div>

      <div className="flex items-center gap-1 border-r border-border pr-2">
        <ToolbarButton 
          icon={ZoomIn} 
          onClick={onZoomIn}
          title="Zoom In (Ctrl++)" 
        />
        <ToolbarButton 
          icon={ZoomOut} 
          onClick={onZoomOut}
          title="Zoom Out (Ctrl+-)" 
        />
      </div>

      <div className="flex items-center gap-1 border-r border-border pr-2">
        <ToolbarButton 
          icon={Save} 
          onClick={onSave}
          title="Save (Ctrl+S)" 
        />
        <ToolbarButton 
          icon={Download} 
          onClick={onExport}
          title="Export" 
        />
        <ToolbarButton 
          icon={Share} 
          onClick={onShare}
          title="Share" 
        />
      </div>

      <div className="flex items-center gap-1">
        <ToolbarButton 
          icon={Settings} 
          onClick={onSettings}
          title="Settings" 
        />
        <ToolbarButton 
          icon={Trash} 
          onClick={onClear}
          title="Clear Canvas" 
        />
      </div>
    </div>
  );
}
