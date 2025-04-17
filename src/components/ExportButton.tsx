import React from 'react';
import { Download } from 'lucide-react';
import { toolRegistry } from '../lib/tools/tool-registry';
import { thoughtLogger } from '../lib/logging/thought-logger';

interface ExportButtonProps {
  readonly data: any[];
  readonly filename?: string;
  readonly onExport?: (success: boolean) => void;
}

export function ExportButton({ data, filename, onExport }: Readonly<ExportButtonProps>) { // Mark props as read-only
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (isExporting || !data.length) return;

    setIsExporting(true);
    try {
      const result = await toolRegistry.executeTool('export-to-csv', data);
      
      if (result.success) {
        thoughtLogger.log('success', `Exported ${result.result.rowCount} rows to CSV`);
        onExport?.(true);
      } else {
        thoughtLogger.log('error', `Export failed: ${result.error}`);
        onExport?.(false);
      }
    } catch (error) {
      thoughtLogger.log('error', `Export error: ${error}`);
      onExport?.(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !data.length}
      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
        isExporting || !data.length
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
