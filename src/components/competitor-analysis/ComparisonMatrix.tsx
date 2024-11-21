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
            {competitors.map(competitor => (
              <th key={competitor.id} className="p-4 text-left font-medium">
                {competitor.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, i) => (
            <tr key={category} className={i % 2 === 0 ? 'bg-gray-800/50' : ''}>
              <td className="p-4 font-medium">{category}</td>
              {competitors.map(competitor => (
                <td key={competitor.id} className="p-4">
                  <div className="flex items-center space-x-2">
                    {getComparisonIcon(competitor.scores[category.toLowerCase()])}
                    <span>{getScoreLabel(competitor.scores[category.toLowerCase()])}</span>
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

function getComparisonIcon(score: number) {
  if (score >= 8) {
    return <Check className="w-4 h-4 text-green-400" />;
  }
  if (score >= 5) {
    return <Minus className="w-4 h-4 text-yellow-400" />;
  }
  return <X className="w-4 h-4 text-red-400" />;
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Average';
  return 'Poor';
}