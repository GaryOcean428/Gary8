import React from 'react';
import { Download } from 'lucide-react';
import { toolRegistry } from '../lib/tools/tool-registry';

interface DataTableProps {
  readonly data: any[]; // Corrected duplicate identifier
}

export function DataTable({ data }: Readonly<DataTableProps>) { 
  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0]);

  const handleExport = async () => {
    try {
      await toolRegistry.executeTool('export-to-csv', data);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              {headers.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider bg-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((row, i) => (
              // Use row.id if available, otherwise fallback to index with prefix
              <tr key={row.id ?? `row-${i}`} className="hover:bg-gray-700"> 
                {headers.map(header => (
                  <td key={`${row.id ?? `row-${i}`}-${header}`} className="px-4 py-3 text-sm"> {/* Also make cell key more unique */}
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
