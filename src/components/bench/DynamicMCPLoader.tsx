import { useEffect, useState } from 'react';

interface DynamicMCPLoaderProps {
  readonly name: string;
}

/**
 * A component that dynamically imports and renders another component
 */
export function DynamicMCPLoader({ name }: DynamicMCPLoaderProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Dynamic import of the component
    import(`../mcp/${name}.tsx`)
      .then(_module => {
        setComponent(() => _module[name]);
        setError(null);
      })
      .catch(_err => {
        console.error(`Failed to load ${name}:`, _err);
        setError(_err);
      });
  }, [name]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
        <h3 className="font-medium mb-2">Error Loading Component</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Component />;
}
