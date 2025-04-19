import React from 'react';
import { Bar, Radar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { CompetitorData } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalysisDashboardProps {
  competitors: CompetitorData[];
  metrics: Record<string, number>;
}

export function AnalysisDashboard({ competitors, metrics }: AnalysisDashboardProps) {
  const radarData = {
    labels: ['Branding', 'Features', 'UX', 'Technical', 'Marketing', 'Mobile', 'Market', 'Innovation'],
    datasets: competitors.map((_competitor, _index) => ({
      label: _competitor.name,
      data: Object.values(_competitor.scores),
      backgroundColor: `rgba(59, 130, 246, ${0.2 + (_index * 0.1)})`,
      borderColor: `rgba(59, 130, 246, ${0.8 + (_index * 0.1)})`,
      borderWidth: 2,
      fill: true
    }))
  };

  const barData = {
    labels: competitors.map(_c => _c.name),
    datasets: [{
      label: 'Market Share',
      data: competitors.map(_c => _c.metrics.marketShare),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="card p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Competitive Analysis</h3>
          <div className="aspect-square">
            <Radar 
              data={radarData}
              options={{
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                      stepSize: 2
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Market Share Distribution</h3>
          <Bar 
            data={barData}
            options={{
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: _value => `${_value}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}