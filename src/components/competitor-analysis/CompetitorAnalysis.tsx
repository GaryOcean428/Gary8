import React, { useState } from 'react';
import { AnalysisParameters } from './AnalysisParameters';
import { AnalysisDashboard } from './AnalysisDashboard';
import { AnalysisReport } from './AnalysisReport';
import { ComparisonMatrix } from './ComparisonMatrix';
import { StrategicInsights } from './StrategicInsights';
import { useCompetitorAnalysis } from '../../hooks/useCompetitorAnalysis';
import { CompetitorData, AnalysisParams } from './types';

export function CompetitorAnalysis() {
  const {
    analyze,
    isLoading,
    report,
    competitors,
    insights,
    metrics
  } = useCompetitorAnalysis();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'matrix' | 'insights'>('dashboard');

  const handleAnalysis = async (params: AnalysisParams) => {
    await analyze(params);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalysisDashboard competitors={competitors} metrics={metrics} />;
      case 'report':
        return <AnalysisReport report={report} />;
      case 'matrix':
        return <ComparisonMatrix competitors={competitors} />;
      case 'insights':
        return <StrategicInsights insights={insights} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Competitor Analysis</h1>
        <p className="text-gray-400">
          Comprehensive competitor analysis and strategic insights
        </p>
      </div>

      <AnalysisParameters onAnalyze={handleAnalysis} isLoading={isLoading} />

      {(competitors.length > 0 || report) && (
        <>
          <div className="flex flex-wrap gap-2 mb-6 bg-gray-800/50 p-2 rounded-lg backdrop-blur-sm">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'report', label: 'Detailed Report' },
              { id: 'matrix', label: 'Comparison Matrix' },
              { id: 'insights', label: 'Strategic Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6 overflow-x-auto">
            {renderContent()}
          </div>
        </>
      )}
    </div>
  );
}