import { Check } from 'lucide-react';
import { BaseSandbox } from '../shared/BaseSandbox';
import './CanvasSandbox.css';

interface CanvasSandboxProps {
  readonly initialCode?: string;
  readonly language?: string;
  readonly onExecute?: (result: string) => void;
  readonly height?: string;
  readonly readOnly?: boolean;
}

/**
 * CanvasSandbox - A code sandbox component for the Canvas interface
 */
export function CanvasSandbox({
  initialCode = '',
  language = 'javascript',
  onExecute,
  height = '400px',
  readOnly = false
}: CanvasSandboxProps) {
  // Use the shared BaseSandbox component with Canvas-specific configurations
  return (
    <BaseSandbox
      initialCode={initialCode}
      language={language}
      onExecute={onExecute}
      height={height}
      readOnly={readOnly}
      checkIcon={<Check className="h-2 w-2" />}
      sandboxLabel="Canvas Sandbox"
      containerClassName="canvas-sandbox-container canvas-sandbox-height"
      sandboxClassName="sandbox-hidden"
      cssVariableName="--sandbox-height"
    />
  );
}
