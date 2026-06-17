import { useSearchParams } from 'react-router-dom';
import { Activity, Clock, Award, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePipeline } from '@/hooks/usePipeline';
import { getAgentExecution } from '@/hooks/usePipeline';

const AGENT_LABELS: Record<string, string> = {
  data_engineer: 'Data Engineer',
  statistician: 'Statistician',
  ml_engineer: 'ML Engineer',
  strategist: 'Strategist',
  designer: 'Designer',
};

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { status, loading, error } = usePipeline({
    runId,
    pollInterval: 3000,
    autoFetch: !!runId,
  });

  const run = status?.run;
  const executions = status?.executions || [];
  const progress = status?.progress_percent || 0;

  // Calculate quality score display (fix the 9300% bug by dividing if > 100)
  const rawQualityScore = run?.quality_score_avg || 0;
  const qualityScore = rawQualityScore > 100 ? rawQualityScore / 100 : rawQualityScore;

  const getQualityLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  if (!runId) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Pipeline Selected</h2>
            <p className="text-gray-500">Start a pipeline run or select one from History to view the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Pipeline run not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge
              variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}
              className="capitalize"
            >
              {run.status}
            </Badge>
            <span className="text-sm text-gray-500">{run.dataset_name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Pipeline run for {run.dataset_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-sm text-gray-600 font-medium">Live</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}
              className="text-sm capitalize px-3 py-1"
            >
              {run.status}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Started: {formatDate(run.started_at)}</p>
          </CardContent>
        </Card>

        {/* Duration Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{formatDuration(run.total_time_ms)}</p>
          </CardContent>
        </Card>

        {/* Quality Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{qualityScore.toFixed(1)}%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">{getQualityLabel(qualityScore)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Question */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Business Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{run.business_question || 'No question provided'}</p>
        </CardContent>
      </Card>

      {/* Pipeline Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{executions.filter(e => e.status === 'completed').length} of {executions.length || 5} agents completed</span>
            <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Agent Executions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Executions</h2>
        <div className="space-y-3">
          {(['data_engineer', 'statistician', 'ml_engineer', 'strategist', 'designer'] as const).map(
            (agentName) => {
              const execution = getAgentExecution(status, agentName);

              return (
                <Card key={agentName} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-medium text-gray-900">{AGENT_LABELS[agentName] || agentName}</span>
                      </div>
                      <Badge
                        variant={
                          execution?.status === 'completed'
                            ? 'default'
                            : execution?.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {execution?.status || 'pending'}
                      </Badge>
                    </div>

                    {/* Parsed Output Display */}
                    {execution?.output_data && (
                      <AgentOutputDisplay agentName={agentName} output={execution.output_data} />
                    )}

                    {execution?.execution_time_ms && (
                      <p className="text-xs text-gray-400 mt-2">
                        Duration: {formatDuration(execution.execution_time_ms)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Agent Output Display Component =====
function AgentOutputDisplay({
  agentName,
  output,
}: {
  agentName: string;
  output: Record<string, unknown>;
}) {
  switch (agentName) {
    case 'data_engineer':
      return <DataEngineerOutput output={output} />;
    case 'statistician':
      return <StatisticianOutput output={output} />;
    case 'ml_engineer':
      return <MLEngineerOutput output={output} />;
    case 'strategist':
      return <StrategistOutput output={output} />;
    case 'designer':
      return <DesignerOutput output={output} />;
    default:
      return null;
  }
}

function DataEngineerOutput({ output }: { output: Record<string, unknown> }) {
  const schema = output.schema_inferred ? 'Inferred' : 'Not inferred';
  const rowCount = (output.row_count as number) || 0;
  const colCount = (output.column_count as number) || 0;
  const missing = (output.missing_values_pct as number) || 0;
  const outliers = (output.outliers_detected as number) || 0;

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
      <div className="grid grid-cols-2 gap-2">
        <span className="text-gray-500">Schema:</span>
        <span className="text-gray-900 font-medium">{schema}</span>
        <span className="text-gray-500">Rows:</span>
        <span className="text-gray-900 font-medium">{rowCount}</span>
        <span className="text-gray-500">Columns:</span>
        <span className="text-gray-900 font-medium">{colCount}</span>
        <span className="text-gray-500">Missing Values:</span>
        <span className="text-gray-900 font-medium">{missing}%</span>
        <span className="text-gray-500">Outliers:</span>
        <span className="text-gray-900 font-medium">{outliers}</span>
      </div>
    </div>
  );
}

interface CorrItem {
  var1: string;
  var2: string;
  correlation: number;
  significant: boolean;
}

function StatisticianOutput({ output }: { output: Record<string, unknown> }) {
  const correlations = (output.correlations as CorrItem[]) || [];
  const sigCorrs = (output.significant_correlations as number) || 0;

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-gray-500">Distributions analyzed: <span className="text-gray-900 font-medium">{(output.distributions_analyzed as number) || 0}</span></span>
        <span className="text-gray-500">Significant correlations: <span className="text-gray-900 font-medium">{sigCorrs}</span></span>
      </div>
      {correlations.length > 0 && (
        <div className="space-y-1">
          <p className="text-gray-500 text-xs">Correlations:</p>
          {correlations.slice(0, 3).map((c, i) => (
            <p key={i} className="text-gray-700">
              {c.var1} ↔ {c.var2}: <span className="font-medium">{c.correlation?.toFixed(3)}</span>
              {c.significant && <span className="text-green-600 ml-1">*</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function MLEngineerOutput({ output }: { output: Record<string, unknown> }) {
  const bestModel = (output.best_model as string) || 'N/A';
  const bestR2 = (output.best_r2 as number) || 0;
  const models = (output.models_evaluated as Array<Record<string, unknown>>) || [];
  const features = output.feature_importance as Record<string, number> | undefined;

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
      <div className="grid grid-cols-2 gap-2">
        <span className="text-gray-500">Best Model:</span>
        <span className="text-gray-900 font-medium">{bestModel}</span>
        <span className="text-gray-500">R² Score:</span>
        <span className="text-gray-900 font-medium">{bestR2}</span>
        <span className="text-gray-500">Models Evaluated:</span>
        <span className="text-gray-900 font-medium">{models.length}</span>
      </div>
      {features && Object.keys(features).length > 0 && (
        <div className="mt-2">
          <p className="text-gray-500 text-xs mb-1">Top Feature: <span className="text-gray-900 font-medium">{Object.entries(features).sort((a, b) => b[1] - a[1])[0]?.[0]}</span></p>
        </div>
      )}
    </div>
  );
}

function StrategistOutput({ output }: { output: Record<string, unknown> }) {
  const insights = (output.business_insights as string[]) || [];
  const roi = output.roi_projection as Record<string, string> | undefined;

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
      {insights.length > 0 && (
        <p className="text-gray-700 line-clamp-2">{insights[0]}</p>
      )}
      {roi && (
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="text-gray-500">ROI: <span className="text-green-600 font-medium">{roi.conservative}</span></span>
          <span className="text-gray-500">Mod: <span className="text-green-600 font-medium">{roi.moderate}</span></span>
          <span className="text-gray-500">Opt: <span className="text-green-600 font-medium">{roi.optimistic}</span></span>
        </div>
      )}
    </div>
  );
}

function DesignerOutput({ output }: { output: Record<string, unknown> }) {
  const chartsGenerated = (output.charts_generated as number) || 0;
  const reportGenerated = output.report_generated as boolean;

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
      <div className="flex items-center gap-4">
        <span className="text-gray-500">Charts Generated: <span className="text-gray-900 font-medium">{chartsGenerated}</span></span>
        <span className="text-gray-500">Report: <span className={reportGenerated ? 'text-green-600 font-medium' : 'text-gray-400'}>{reportGenerated ? 'Yes' : 'No'}</span></span>
      </div>
    </div>
  );
}
