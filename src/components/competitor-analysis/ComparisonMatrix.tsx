import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import type { CompetitorData } from './types';

interface ComparisonMatrixProps {
  competitors: CompetitorData[];
}

export function ComparisonMatrix({ competitors }: ComparisonMatrixProps) {
  const categories = [
    'Features & Capabilities',
    'User Experience',
    'Technical Infrastructure',
    'Mobile Support',
    'Marketing & Content',
    'Customer Support',
    'Pricing & Plans',
    'Integration Options'
  ];

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-4 text-left font-medium">Category</th>
            {competitors.map(_competitor => (
              <th key={_competitor.id} className="p-4 text-left font-medium">
                {_competitor.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((_category, _i) => (
            <tr key={_category} className={_i % 2 === 0 ? 'bg-gray-800/50' : ''}>
              <td className="p-4 font-medium">{_category}</td>
              {competitors.map(_competitor => (
                <td key={_competitor.id} className="p-4">
                  <div className="flex items-center space-x-2">
                    {getComparisonIcon(_competitor.scores[_category.toLowerCase()])}
                    <span>{getScoreLabel(_competitor.scores[_category.toLowerCase()])}</span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getComparisonIcon(_score: number) {
  if (_score >= 8) {
    return <Check className="w-4 h-4 text-green-400" />;
  }
  if (_score >= 5) {
    return <Minus className="w-4 h-4 text-yellow-400" />;
  }
  return <X className="w-4 h-4 text-red-400" />;
}

function getScoreLabel(_score: number): string {
  if (_score >= 8) return 'Excellent';
  if (_score >= 6) return 'Good';
  if (_score >= 4) return 'Average';
  return 'Poor';
}