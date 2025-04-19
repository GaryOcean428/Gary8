import React from 'react';
import { TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import type { AnalysisInsight } from './types';

interface StrategicInsightsProps {
  insights: AnalysisInsight[];
}

export function StrategicInsights({ insights }: StrategicInsightsProps) {
  const getImpactColor = (_impact: 'high' | 'medium' | 'low') => {
    switch (_impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((_insight, _index) => (
          <div key={_index} className="card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-medium">{_insight.title}</h3>
              </div>
              <span className={`text-sm ${getImpactColor(_insight.impact)}`}>
                {_insight.impact.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-400">{_insight.description}</p>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                <p className="text-sm">{_insight.recommendation}</p>
              </div>
            </div>

            {_insight.metrics && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                {Object.entries(_insight.metrics).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm text-gray-400">{key}</div>
                    <div className="text-lg font-medium">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}