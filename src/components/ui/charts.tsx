import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';

interface ChartProps {
  data: any[];
  height?: number;
  options?: any;
}

export function LineChart({ data, height = 300, options = {} }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Value',
          data: data.map(d => d.value),
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        ...options
      }
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, options]);

  return (
    <canvas
      ref={chartRef}
      height={height}
      className="w-full"
    />
  );
}

export function BarChart({ data, height = 300, options = {} }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Value',
          data: data.map(d => d.value),
          backgroundColor: 'rgb(59, 130, 246)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        ...options
      }
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, options]);

  return (
    <canvas
      ref={chartRef}
      height={height}
      className="w-full"
    />
  );
} 