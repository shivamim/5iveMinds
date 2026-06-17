import { useSearchParams } from 'react-router-dom';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import type { StrategistOutput, RiskItem, RecommendedAction } from '@/types';

export function Strategy() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { results } = usePipeline({
    runId,
    pollInterval: 5000,
    autoFetch: !!runId,
  });

  const strategyOutput = getAgentOutput(results, 'strategist') as StrategistOutput | null;
  const insights = strategyOutput?.business_insights || [];
  const findings = strategyOutput?.key_findings || [];
  const roi = strategyOutput?.roi_projection;
  const risks = strategyOutput?.risk_matrix || [];
  const actions = strategyOutput?.recommended_actions || [];

  const qualityScore = strategyOutput?.quality_score || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategy</h1>
          <p className="text-gray-500 mt-1">Business insights, ROI analysis, and recommendations</p>
        </div>
        {qualityScore > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Quality Score: {qualityScore.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 && findings.length === 0 ? (
            <EmptyState message="Run a pipeline to generate business insights from your data." />
          ) : (
            <div className="space-y-3">
              {findings.map((finding, i) => (
                <div key={`finding-${i}`} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-800">{finding}</p>
                </div>
              ))}
              {insights.map((insight, i) => (
                <div key={`insight-${i}`} className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-800">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROI Projection */}
      {roi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              ROI Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ROICard label="Conservative" value={roi.conservative} color="text-gray-600" bgColor="bg-gray-50" />
              <ROICard label="Moderate" value={roi.moderate} color="text-blue-600" bgColor="bg-blue-50" />
              <ROICard label="Optimistic" value={roi.optimistic} color="text-green-600" bgColor="bg-green-50" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Risk Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <EmptyState message="No risk analysis available. Run a pipeline to generate risk assessments." />
          ) : (
            <div className="space-y-2">
              {risks.map((risk, i) => (
                <RiskRow key={i} risk={risk} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <EmptyState message="No recommendations available. Run a pipeline to generate actionable recommendations." />
          ) : (
            <div className="space-y-3">
              {actions.map((action, i) => (
                <ActionRow key={i} action={action} index={i} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ROICard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-4 text-center`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RiskRow({ risk }: { risk: RiskItem }) {
  const likelihoodColors: Record<string, string> = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700',
  };

  const impactColors: Record<string, string> = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 truncate">{risk.risk}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <Badge variant="secondary" className={likelihoodColors[risk.likelihood] || 'bg-gray-100'}>
          {risk.likelihood}
        </Badge>
        <Badge variant="secondary" className={impactColors[risk.impact] || 'bg-gray-100'}>
          {risk.impact} Impact
        </Badge>
      </div>
    </div>
  );
}

function ActionRow({ action, index }: { action: RecommendedAction; index: number }) {
  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-green-100 text-green-700 border-green-200',
  };

  const progress = Math.max(0, 100 - index * 20);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
            {index + 1}
          </div>
          <p className="text-sm text-gray-800 font-medium">{action.action}</p>
        </div>
        <Badge variant="outline" className={priorityColors[action.priority] || 'bg-gray-100'}>
          {action.priority}
        </Badge>
      </div>
      <div className="flex items-center gap-3 ml-9">
        <span className="text-xs text-gray-500">Timeline: {action.timeline}</span>
        <div className="flex-1">
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
