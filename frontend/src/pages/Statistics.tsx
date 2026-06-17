import { useSearchParams } from 'react-router-dom';
import { BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePipeline, getAgentOutput, getChart } from '@/hooks/usePipeline';
import type { StatisticianOutput, CorrelationItem } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useState, useEffect } from 'react';

export function Statistics() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { results } = usePipeline({
    runId,
    pollInterval: 5000,
    autoFetch: !!runId,
  });

  const statsOutput = getAgentOutput(results, 'statistician') as StatisticianOutput | null;
  const correlations = statsOutput?.correlations || [];
  const hypothesisTests = (statsOutput?.hypothesis_tests as Array<Record<string, unknown>>) || [];

  // Get histogram chart data
  const histogramChart = getChart(results, 'histogram');
  const histogramData = histogramChart?.chart_data;

  // Get correlation heatmap data
  const correlationChart = getChart(results, 'correlation_heatmap');
  const correlationMatrix = correlationChart?.chart_data?.matrix as Record<string, Record<string, number>> | undefined;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistical Analysis</h1>
        <p className="text-gray-500 mt-1">EDA, distributions, hypothesis testing, and correlation analysis</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {!histogramData ? (
              <EmptyChart message="No distribution data available. Run a pipeline to generate histograms." />
            ) : (
              <DistributionChart data={histogramData} />
            )}
          </CardContent>
        </Card>

        {/* Correlation Matrix */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {!correlationMatrix && correlations.length === 0 ? (
              <EmptyChart message="No correlation data available." />
            ) : correlationMatrix ? (
              <CorrelationHeatmap matrix={correlationMatrix} />
            ) : (
              <CorrelationList correlations={correlations} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hypothesis Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Hypothesis Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {hypothesisTests.length === 0 && correlations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hypothesis test results available.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show correlation p-values as hypothesis tests */}
              {correlations.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {c.var1} vs {c.var2}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      c.p_value < 0.05 ? 'text-green-600' : 'text-amber-600'
                    }`}
                  >
                    p = {c.p_value?.toFixed(3)} ({c.p_value < 0.05 ? 'significant' : 'not significant'})
                  </span>
                </div>
              ))}
              {/* Show actual hypothesis tests */}
              {hypothesisTests.map((test, i) => (
                <div
                  key={`test-${i}`}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {(test.name as string) || (test.test as string) || 'Test'}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      (test.p_value as number) < 0.05 ? 'text-green-600' : 'text-amber-600'
                    }`}
                  >
                    p = {typeof test.p_value === 'number' ? test.p_value.toFixed(3) : 'N/A'} ({(test.p_value as number) < 0.05 ? 'significant' : 'not significant'})
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Distribution Chart Component =====
function DistributionChart({ data }: { data: Record<string, unknown> }) {
  const [chartData, setChartData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    // Parse different histogram data formats
    if (data.bins && data.counts) {
      const bins = data.bins as number[];
      const counts = data.counts as number[];
      setChartData(
        bins.slice(0, -1).map((bin, i) => ({
          name: bin.toFixed(1),
          value: counts[i] || 0,
        }))
      );
    } else if (data.values) {
      const values = data.values as number[];
      // Create frequency map
      const freq: Record<string, number> = {};
      values.forEach((v) => {
        const key = typeof v === 'number' ? v.toFixed(1) : String(v);
        freq[key] = (freq[key] || 0) + 1;
      });
      setChartData(Object.entries(freq).map(([name, value]) => ({ name, value })));
    } else if (data.distribution) {
      const dist = data.distribution as Record<string, number>;
      setChartData(Object.entries(dist).map(([name, value]) => ({ name, value })));
    } else if (data.frequencies) {
      const freq = data.frequencies as Record<string, number>;
      setChartData(Object.entries(freq).map(([name, value]) => ({ name, value })));
    } else {
      // Fallback: try to use any numeric array fields
      const entries = Object.entries(data).filter(([_, v]) => Array.isArray(v));
      if (entries.length >= 2) {
        const labels = entries[0][1] as string[];
        const values = entries[1][1] as number[];
        setChartData(labels.map((name, i) => ({ name: String(name), value: values[i] || 0 })));
      }
    }
  }, [data]);

  if (chartData.length === 0) {
    return <EmptyChart message="Unable to parse distribution data." />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 5}, 80%, ${60 + (index % 3) * 5}%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===== Correlation Heatmap Component =====
function CorrelationHeatmap({ matrix }: { matrix: Record<string, Record<string, number>> }) {
  const variables = Object.keys(matrix);

  if (variables.length === 0) {
    return <EmptyChart message="Empty correlation matrix." />;
  }

  const getColor = (value: number) => {
    const intensity = Math.abs(value);
    if (value > 0) {
      return `rgba(34, 197, 94, ${0.1 + intensity * 0.9})`;
    }
    return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2"></th>
            {variables.map((v) => (
              <th key={v} className="p-2 text-xs font-medium text-gray-600 text-center rotate-45">
                {v}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variables.map((row) => (
            <tr key={row}>
              <td className="p-2 text-xs font-medium text-gray-600">{row}</td>
              {variables.map((col) => {
                const value = matrix[row]?.[col] ?? 0;
                return (
                  <td
                    key={col}
                    className="p-2 text-center text-xs font-medium"
                    style={{ backgroundColor: getColor(value) }}
                  >
                    {value.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Correlation List Component (fallback) =====
function CorrelationList({ correlations }: { correlations: CorrelationItem[] }) {
  if (correlations.length === 0) {
    return <EmptyChart message="No correlations found." />;
  }

  return (
    <div className="space-y-2">
      {correlations.map((c, i) => (
        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-700">
            {c.var1} ↔ {c.var2}
          </span>
          <span
            className={`text-sm font-medium ${
              Math.abs(c.correlation) > 0.7
                ? 'text-green-600'
                : Math.abs(c.correlation) > 0.3
                ? 'text-amber-600'
                : 'text-gray-500'
            }`}
          >
            {c.correlation?.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-center">
      <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-gray-500 text-sm max-w-xs">{message}</p>
    </div>
  );
}
