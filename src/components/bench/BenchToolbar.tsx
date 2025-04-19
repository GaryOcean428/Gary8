import { 
  MousePointer, 
  Square, 
  Circle, 
  Type, 
  Pencil,
  Undo,
  Redo,
  Code,
  Download
} from 'lucide-react';

interface BenchToolbarProps {
  readonly selectedTool: string;
  readonly onToolChange: (tool: string) => void;
  readonly onShapeAdd: (type: string) => void;
  readonly onUndo?: () => void;
  readonly onRedo?: () => void;
  readonly onExport?: (format: string) => void;
}

export function BenchToolbar({
  selectedTool,
  onToolChange,
  onShapeAdd,
  onUndo,
  onRedo,
  onExport
}: BenchToolbarProps) {
  return (
    <div className="absolute left-4 top-20 bg-white rounded-lg shadow-lg p-2 space-y-2">
      <ToolButton
        icon={MousePointer}
        tooltip="Select"
        isSelected={selectedTool === 'select'}
        onClick={() => onToolChange('select')}
      />
      <ToolButton
        icon={Square}
        tooltip="Rectangle"
        isSelected={selectedTool === 'rectangle'}
        onClick={() => onShapeAdd('rectangle')}
      />
      <ToolButton
        icon={Circle}
        tooltip="Circle"
        isSelected={selectedTool === 'circle'}
        onClick={() => onShapeAdd('circle')}
      />
      <ToolButton
        icon={Type}
        tooltip="Text"
        isSelected={selectedTool === 'text'}
        onClick={() => onShapeAdd('text')}
      />
      <ToolButton
        icon={Pencil}
        tooltip="Draw"
        isSelected={selectedTool === 'draw'}
        onClick={() => onToolChange('draw')}
      />
      <div className="border-t border-gray-200 my-2" />
      <ToolButton
        icon={Undo}
        tooltip="Undo"
        onClick={onUndo ? () => onUndo() : undefined}
        disabled={!onUndo}
      />
      <ToolButton
        icon={Redo}
        tooltip="Redo"
        onClick={onRedo ? () => onRedo() : undefined}
        disabled={!onRedo}
      />
      <div className="border-t border-gray-200 my-2" />
      <ToolButton
        icon={Code}
        tooltip="Export to React"
        onClick={() => onExport?.('react')}
      />
      <ToolButton
        icon={Download}
        tooltip="Export to HTML"
        onClick={() => onExport?.('html')}
      />
    </div>
  );
}

interface ToolButtonProps {
  readonly icon: typeof MousePointer;
  readonly tooltip: string;
  readonly isSelected?: boolean;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

function ToolButton({
  icon: Icon,
  tooltip,
  isSelected,
  disabled,
  onClick
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group p-2 rounded-lg transition-colors ${
        isSelected
          ? 'bg-blue-100 text-blue-700'
          : 'hover:bg-gray-100 text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-5 h-5" />
      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {tooltip}
      </span>
    </button>
  );
}
