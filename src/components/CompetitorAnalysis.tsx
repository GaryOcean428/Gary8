import React, { useState } from 'react';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';
import { toolRegistry } from '../lib/tools/tool-registry';
import { DataTable } from './DataTable';
import ReactMarkdown from 'react-markdown';

interface AnalysisParams {
  industry: string;
  region: string;
  criteria: string[];
}

export function CompetitorAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string>('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [params, setParams] = useState<AnalysisParams>({
    industry: '',
    region: '',
    criteria: ['market_share', 'pricing', 'services', 'technology']
  });

  const analysisCriteria = [
    { id: 'market_share', label: 'Market Share' },
    { id: 'pricing', label: 'Pricing Strategy' },
    { id: 'services', label: 'Services Offered' },
    { id: 'technology', label: 'Technology Stack' },
    { id: 'customer_base', label: 'Customer Base' },
    { id: 'growth', label: 'Growth Rate' },
    { id: 'reputation', label: 'Brand Reputation' },
    { id: 'innovation', label: 'Innovation' }
  ];

  const analyzeCompetitors = async () => {
    if (!params.industry || !params.region) return;
    
    setIsLoading(true);
    try {
      const result = await toolRegistry.executeTool(
        'analyze-competitors',
        params.industry,
        params.region,
        params.criteria
      );

      if (result.success && result.result) {
        setReport(result.result.report);
        setCsvData(result.result.csvData);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCriterion = (criterionId: string) => {
    setParams((prev: AnalysisParams) => ({ // Add type for prev
      ...prev,
      criteria: prev.criteria.includes(criterionId)
        ? prev.criteria.filter((c: string) => c !== criterionId) // Add type for c
        : [...prev.criteria, criterionId]
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Competitor Analysis</h1>
          <p className="text-gray-400 mt-1">
            Analyze competitors in your industry using AI-powered insights
          </p>
        </div>
        <button
          onClick={analyzeCompetitors}
          disabled={isLoading || !params.industry || !params.region}
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Analyze Competitors</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Parameters */}
      <div className="card p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="industryInput" className="block text-sm font-medium mb-2">Industry</label> {/* Add htmlFor */}
            <input
              id="industryInput" // Add id
              type="text"
              value={params.industry}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParams((prev: AnalysisParams) => ({ ...prev, industry: e.target.value }))} // Add types
              placeholder="e.g., Software Development, Healthcare, Retail"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="regionInput" className="block text-sm font-medium mb-2">Region</label> {/* Add htmlFor */}
            <input
              id="regionInput" // Add id
              type="text"
              value={params.region}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParams((prev: AnalysisParams) => ({ ...prev, region: e.target.value }))} // Add types
              placeholder="e.g., North America, Europe, Global"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Analysis Criteria
          </label>
          <div className="flex flex-wrap gap-2">
            {analysisCriteria.map(criterion => (
              <button
                key={criterion.id}
                onClick={() => toggleCriterion(criterion.id)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                  params.criteria.includes(criterion.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Filter className="w-3 h-3 mr-1" />
                {criterion.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {report && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>

          {csvData.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Competitor Data</h2>
                <button
                  onClick={() => {
                    // Export functionality
                  }}
                  className="btn btn-secondary inline-flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <DataTable data={csvData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
