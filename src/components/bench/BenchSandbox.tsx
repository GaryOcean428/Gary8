import { BaseSandbox } from '../shared/BaseSandbox';

// Custom check icon component to avoid import issues
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="lucide lucide-check"
    {...props}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

interface BenchSandboxProps {
  readonly initialCode?: string;
  readonly language?: string;
  readonly onExecute?: (result: string) => void;
  readonly height?: string;
  readonly readOnly?: boolean;
}

/**
 * BenchSandbox - A code sandbox component for the Bench interface
 */
export function BenchSandbox({
  initialCode = '',
  language = 'javascript',
  onExecute,
  height = '400px',
  readOnly = false
}: BenchSandboxProps) {
  // Use the shared BaseSandbox component with Bench-specific configurations
  return (
    <BaseSandbox
      initialCode={initialCode}
      language={language}
      onExecute={onExecute}
      height={height}
      readOnly={readOnly}
      checkIcon={<CheckIcon className="h-2 w-2" />}
      sandboxLabel="Workbench Sandbox"
      containerClassName={`rounded-lg border border-border bg-card shadow-md overflow-hidden flex flex-col h-${height}`}
      sandboxClassName="hidden"
    />
  );
}
