import { useSearchParams } from 'react-router-dom';
import { BrainCircuit, Trophy, Zap, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePipeline, getAgentOutput, getChart } from '@/hooks/usePipeline';
import type { MLEngineerOutput, ModelEvaluated } from '@/types';
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

export function MLResults() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { results } = usePipeline({
    runId,
    pollInterval: 5000,
    autoFetch: !!runId,
  });

  const mlOutput = getAgentOutput(results, 'ml_engineer') as MLEngineerOutput | null;
  const featureImportance = mlOutput?.feature_importance || {};
  const modelsEvaluated = mlOutput?.models_evaluated || [];
  const bestModel = mlOutput?.best_model || 'N/A';
  const bestR2 = mlOutput?.best_r2 || 0;
  const bestRmse = mlOutput?.best_rmse || 0;

  // Get charts
  const featureImportanceChart = getChart(results, 'feature_importance');
  const modelComparisonChart = getChart(results, 'model_comparison');
  const shapChart = getChart(results, 'shap_summary');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ML Results</h1>
        <p className="text-gray-500 mt-1">AutoML model selection and SHAP explainability</p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">Best Model</p>
                <p className="text-xl font-bold text-gray-900">{bestModel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">R² Score</p>
                <p className="text-xl font-bold text-gray-900">{bestR2.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">RMSE</p>
                <p className="text-xl font-bold text-gray-900">{bestRmse.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!featureImportanceChart && Object.keys(featureImportance).length === 0 ? (
              <EmptyState message="No feature importance data available." />
            ) : (
              <FeatureImportanceChart
                chartData={featureImportanceChart?.chart_data}
                fallbackData={featureImportance}
              />
            )}
          </CardContent>
        </Card>

        {/* Model Comparison */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Model Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!modelComparisonChart && modelsEvaluated.length === 0 ? (
              <EmptyState message="No model comparison data available." />
            ) : (
              <ModelComparisonChart
                chartData={modelComparisonChart?.chart_data}
                fallbackData={modelsEvaluated}
              />
            )}
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modelsEvaluated.length === 0 ? (
              <EmptyState message="No metrics data available." />
            ) : (
              <MetricsTable models={modelsEvaluated} />
            )}
          </CardContent>
        </Card>

        {/* SHAP Summary */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              SHAP Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!shapChart ? (
              <EmptyState message="No SHAP summary available from the ML Engineer agent." />
            ) : (
              <SHAPSummary chartData={shapChart.chart_data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===== Feature Importance Chart =====
function FeatureImportanceChart({
  chartData,
  fallbackData,
}: {
  chartData?: Record<string, unknown>;
  fallbackData: Record<string, number>;
}) {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    if (chartData) {
      // Parse chart data
      if (chartData.features && chartData.importance) {
        const features = chartData.features as string[];
        const importance = chartData.importance as number[];
        setData(
          features
            .map((name, i) => ({ name, value: importance[i] || 0 }))
            .sort((a, b) => b.value - a.value)
        );
      } else if (chartData.values) {
        const values = chartData.values as Record<string, number>;
        setData(Object.entries(values).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
      } else {
        // Try to find any key-value pairs
        const entries = Object.entries(chartData).filter(([_, v]) => typeof v === 'number');
        if (entries.length > 0) {
          setData(entries.map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value));
        }
      }
    } else if (Object.keys(fallbackData).length > 0) {
      setData(
        Object.entries(fallbackData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
    }
  }, [chartData, fallbackData]);

  if (data.length === 0) {
    return <EmptyState message="No feature importance data to display." />;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={`hsl(${220 - index * 15}, 70%, 55%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===== Model Comparison Chart =====
function ModelComparisonChart({
  chartData,
  fallbackData,
}: {
  chartData?: Record<string, unknown>;
  fallbackData: ModelEvaluated[];
}) {
  const [data, setData] = useState<Array<{ name: string; r2: number; rmse: number }>>([]);

  useEffect(() => {
    if (chartData) {
      if (chartData.models && chartData.scores) {
        const models = chartData.models as string[];
        const scores = chartData.scores as number[];
        setData(models.map((name, i) => ({ name, r2: scores[i] || 0, rmse: 0 })));
      } else if (chartData.r2_scores) {
        const r2Scores = chartData.r2_scores as Record<string, number>;
        setData(Object.entries(r2Scores).map(([name, r2]) => ({ name, r2, rmse: 0 })));
      }
    } else if (fallbackData.length > 0) {
      setData(
        fallbackData.map((m) => ({ name: m.name, r2: m.r2, rmse: m.rmse }))
      );
    }
  }, [chartData, fallbackData]);

  if (data.length === 0) {
    return <EmptyState message="No model comparison data to display." />;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="r2" fill="#10b981" radius={[4, 4, 0, 0]} name="R² Score" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===== Metrics Table =====
function MetricsTable({ models }: { models: ModelEvaluated[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-500">Model</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">R²</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">RMSE</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Suitable For</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  {i === 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Best</Badge>}
                  {model.name}
                </div>
              </td>
              <td className="py-2 px-3 text-gray-700">{model.r2?.toFixed(3)}</td>
              <td className="py-2 px-3 text-gray-700">{model.rmse?.toFixed(4)}</td>
              <td className="py-2 px-3 text-gray-500 text-xs">{model.suitable_for}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== SHAP Summary =====
function SHAPSummary({ chartData }: { chartData: Record<string, unknown> }) {
  const [data, setData] = useState<Array<{ feature: string; importance: number }>>([]);

  useEffect(() => {
    if (chartData.features && chartData.values) {
      const features = chartData.features as string[];
      const values = chartData.values as number[];
      setData(
        features
          .map((feature, i) => ({ feature, importance: Math.abs(values[i] || 0) }))
          .sort((a, b) => b.importance - a.importance)
      );
    } else if (chartData.shap_values) {
      const shapValues = chartData.shap_values as Record<string, number>;
      setData(
        Object.entries(shapValues)
          .map(([feature, importance]) => ({ feature, importance: Math.abs(importance) }))
          .sort((a, b) => b.importance - a.importance)
      );
    }
  }, [chartData]);

  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <pre className="bg-gray-50 rounded-lg p-3 overflow-auto max-h-[250px]">
          {JSON.stringify(chartData, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data.slice(0, 10)} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="|SHAP Value|" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[250px] text-center">
      <BrainCircuit className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-gray-500 text-sm max-w-xs">{message}</p>
    </div>
  );
}
