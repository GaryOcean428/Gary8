import React, { useState } from 'react';
import { Search, Plus, Trash2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import type { AnalysisParams, AnalysisCriterion } from './types';

interface AnalysisParametersProps {
  onAnalyze: (params: AnalysisParams) => Promise<void>;
  isLoading: boolean;
}

export function AnalysisParameters({ onAnalyze, isLoading }: AnalysisParametersProps) {
  const [params, setParams] = useState<AnalysisParams>({
    industry: '',
    region: '',
    competitors: [''],
    criteria: defaultCriteria
  });

  const addCompetitor = () => {
    setParams(prev => ({
      ...prev,
      competitors: [...prev.competitors, '']
    }));
  };

  const removeCompetitor = (index: number) => {
    setParams(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  };

  const updateCompetitor = (index: number, value: string) => {
    setParams(prev => ({
      ...prev,
      competitors: prev.competitors.map((c, i) => i === index ? value : c)
    }));
  };

  const updateCriterionWeight = (id: string, weight: number) => {
    setParams(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => 
        c.id === id ? { ...c, weight } : c
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(params);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Industry</label>
          <input
            type="text"
            value={params.industry}
            onChange={(e) => setParams(prev => ({ ...prev, industry: e.target.value }))}
            placeholder="e.g., Software Development, Healthcare"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Region</label>
          <input
            type="text"
            value={params.region}
            onChange={(e) => setParams(prev => ({ ...prev, region: e.target.value }))}
            placeholder="e.g., North America, Global"
            className="input"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Competitors</label>
          <button
            type="button"
            onClick={addCompetitor}
            className="text-blue-400 hover:text-blue-300 p-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {params.competitors.map((competitor, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={competitor}
                onChange={(e) => updateCompetitor(index, e.target.value)}
                placeholder="Competitor name or URL"
                className="input"
              />
              {params.competitors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompetitor(index)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Analysis Criteria</label>
          <button
            type="button"
            className="text-blue-400 hover:text-blue-300 p-1"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {params.criteria.map(criterion => (
            <div key={criterion.id} className="flex items-center space-x-4">
              <span className="text-sm flex-1">{criterion.label}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={criterion.weight}
                onChange={(e) => updateCriterionWeight(criterion.id, parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm w-4">{criterion.weight}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !params.industry || !params.region || !params.competitors[0]}
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
    </form>
  );
}

const defaultCriteria: AnalysisCriterion[] = [
  { id: 'branding', label: 'Visual Design & Branding', weight: 3, category: 'branding' },
  { id: 'features', label: 'Feature Set & Capabilities', weight: 4, category: 'features' },
  { id: 'ux', label: 'User Experience', weight: 4, category: 'ux' },
  { id: 'technical', label: 'Technical Infrastructure', weight: 3, category: 'technical' },
  { id: 'marketing', label: 'Content & Marketing', weight: 3, category: 'marketing' },
  { id: 'mobile', label: 'Mobile & Cross-platform', weight: 4, category: 'mobile' },
  { id: 'market', label: 'Market Positioning', weight: 5, category: 'market' },
  { id: 'innovation', label: 'Innovation & R&D', weight: 4, category: 'innovation' }
];