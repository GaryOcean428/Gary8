import React from 'react';
import { Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisReportProps {
  report: string;
}

export function AnalysisReport({ report }: AnalysisReportProps) {
  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitor-analysis-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Detailed Analysis Report</h2>
        <button
          onClick={handleDownload}
          className="btn btn-secondary inline-flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </button>
      </div>

      <div className="prose prose-invert max-w-none">
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>
    </div>
  );
}