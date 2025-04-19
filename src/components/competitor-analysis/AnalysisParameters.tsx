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
    setParams(_prev => ({
      ..._prev,
      competitors: [..._prev.competitors, '']
    }));
  };

  const removeCompetitor = (_index: number) => {
    setParams(_prev => ({
      ..._prev,
      competitors: _prev.competitors.filter((_, _i) => _i !== _index)
    }));
  };

  const updateCompetitor = (_index: number, _value: string) => {
    setParams(_prev => ({
      ..._prev,
      competitors: _prev.competitors.map((_c, _i) => _i === _index ? _value : _c)
    }));
  };

  const updateCriterionWeight = (_id: string, _weight: number) => {
    setParams(_prev => ({
      ..._prev,
      criteria: _prev.criteria.map(_c => 
        _c.id === _id ? { ..._c, _weight } : _c
      )
    }));
  };

  const handleSubmit = (_e: React.FormEvent) => {
    _e.preventDefault();
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
            onChange={(_e) => setParams(_prev => ({ ..._prev, industry: _e.target.value }))}
            placeholder="e.g., Software Development, Healthcare"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Region</label>
          <input
            type="text"
            value={params.region}
            onChange={(_e) => setParams(_prev => ({ ..._prev, region: _e.target.value }))}
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
          {params.competitors.map((_competitor, _index) => (
            <div key={_index} className="flex items-center space-x-2">
              <input
                type="text"
                value={_competitor}
                onChange={(_e) => updateCompetitor(_index, _e.target.value)}
                placeholder="Competitor name or URL"
                className="input"
              />
              {params.competitors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompetitor(_index)}
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
          {params.criteria.map(_criterion => (
            <div key={_criterion.id} className="flex items-center space-x-4">
              <span className="text-sm flex-1">{_criterion.label}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={_criterion.weight}
                onChange={(_e) => updateCriterionWeight(_criterion.id, parseInt(_e.target.value))}
                className="w-24"
              />
              <span className="text-sm w-4">{_criterion.weight}</span>
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