import { useState } from 'react';
import { toolRegistry } from '../lib/tools/tool-registry';
import type { 
  AnalysisParams, 
  CompetitorData, 
  AnalysisInsight 
} from '../components/competitor-analysis/types';

export function useCompetitorAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string>('');
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  const analyze = async (params: AnalysisParams) => {
    setIsLoading(true);
    try {
      const result = await toolRegistry.executeTool('analyze-competitors', params);

      if (result.success && result.result) {
        setReport(result.result.report);
        setCompetitors(result.result.competitors);
        setInsights(result.result.insights);
        setMetrics(result.result.metrics);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyze,
    isLoading,
    report,
    competitors,
    insights,
    metrics,
  };
}