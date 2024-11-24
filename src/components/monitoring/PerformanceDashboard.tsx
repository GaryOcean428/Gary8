import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart } from '@/components/ui/charts';
import { MonitoringService } from '@/lib/monitoring/monitoring-service';
import { PerformanceOptimizer } from '@/lib/performance/performance-optimizer';
import { thoughtLogger } from '@/lib/utils/logger';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error';
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const monitoring = MonitoringService.getInstance();
  const optimizer = PerformanceOptimizer.getInstance();

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchMetrics() {
    setIsLoading(true);
    try {
      const data = await monitoring.getMetrics(timeRange);
      const processedMetrics = processMetrics(data);
      setMetrics(processedMetrics);
    } catch (error) {
      thoughtLogger.error('Failed to fetch metrics', { error });
    } finally {
      setIsLoading(false);
    }
  }

  function processMetrics(data: any): MetricCard[] {
    return [
      {
        title: 'Response Time',
        value: `${data.avgResponseTime.toFixed(2)}ms`,
        change: data.responseTimeChange,
        icon: <Clock className="w-4 h-4" />,
        status: getMetricStatus(data.avgResponseTime, 100, 200)
      },
      {
        title: 'Memory Usage',
        value: `${(data.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        change: data.memoryUsageChange,
        icon: <HardDrive className="w-4 h-4" />,
        status: getMetricStatus(data.memoryUsage, 500, 800)
      },
      {
        title: 'CPU Load',
        value: `${data.cpuLoad.toFixed(1)}%`,
        change: data.cpuLoadChange,
        icon: <Cpu className="w-4 h-4" />,
        status: getMetricStatus(data.cpuLoad, 70, 90)
      },
      {
        title: 'Cache Hit Rate',
        value: `${data.cacheHitRate.toFixed(1)}%`,
        change: data.cacheHitRateChange,
        icon: <Database className="w-4 h-4" />,
        status: getMetricStatus(data.cacheHitRate, 80, 60, true)
      }
    ];
  }

  function getMetricStatus(
    value: number,
    warningThreshold: number,
    errorThreshold: number,
    inverse = false
  ): 'success' | 'warning' | 'error' {
    if (inverse) {
      if (value > warningThreshold) return 'success';
      if (value > errorThreshold) return 'warning';
      return 'error';
    } else {
      if (value < warningThreshold) return 'success';
      if (value < errorThreshold) return 'warning';
      return 'error';
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Performance Monitoring
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <label htmlFor="time-range" className="sr-only">Select time range</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="rounded-md border p-1"
              title="Select time range for metrics"
              aria-label="Time range for metrics"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
            aria-label="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground">{metric.title}</div>
                <div className="text-2xl font-bold">{metric.value}</div>
              </div>
              <div className={`
                rounded-full p-2
                ${metric.status === 'success' ? 'bg-green-100 text-green-600' :
                  metric.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'}
              `}>
                {metric.icon}
              </div>
            </div>
            {metric.change && (
              <div className={`
                mt-2 text-sm flex items-center gap-1
                ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}
              `}>
                <TrendingUp className="w-4 h-4" />
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Response Time Trend</h3>
          <LineChart
            data={[]} // Add your time series data here
            height={300}
          />
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Resource Usage</h3>
          <BarChart
            data={[]} // Add your resource usage data here
            height={300}
          />
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Performance Alerts</h3>
        <div className="space-y-2">
          {/* Add your alerts here */}
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            <span>High memory usage detected in the last hour</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
