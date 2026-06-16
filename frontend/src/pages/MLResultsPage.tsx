import { useStore } from '@/stores/appStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FeatureImportanceChart,
  ModelComparisonChart,
  MetricsRadar,
} from '@/components/charts'
import { Trophy, FileQuestion } from 'lucide-react'

export function MLResultsPage() {
  // FIXED: Read ml_engineer output from store instead of hardcoded data
  const getAgentOutput = useStore((s) => s.getAgentOutput)
  const agentExecutions = useStore((s) => s.agentExecutions)

  const mlOutput = getAgentOutput('ml_engineer')
  const execution = agentExecutions.find((e) => e.agent_name === 'ml_engineer')

  // Parse ML output
  const bestModel = mlOutput?.best_model as
    | { name: string; cv_score: number; accuracy: number; f1: number }
    | null
  const features = mlOutput?.feature_importance as
    | Array<{ name: string; importance: number }>
    | null
  const models = mlOutput?.model_comparison as
    | Array<{ model: string; accuracy: number; f1: number; cv: number }>
    | null
  const metrics = mlOutput?.metrics as
    | Array<{ metric: string; value: number; fullMark: number }>
    | null
  const shapSummary = mlOutput?.shap_summary as
    | Array<{ feature: string; mean_abs_shap: number }>
    | null

  const bestModelName = bestModel?.name ?? (mlOutput?.best_model_name as string) ?? null
  const bestModelCv = bestModel?.cv_score ?? (mlOutput?.cv_score as number) ?? null
  const bestModelAcc = bestModel?.accuracy ?? (mlOutput?.accuracy as number) ?? null
  const bestModelF1 = bestModel?.f1 ?? (mlOutput?.f1_score as number) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ML Results</h1>
        <p className="text-muted-foreground">
          AutoML model selection and SHAP explainability
        </p>
      </div>

      {execution?.status === 'running' ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Training models and computing SHAP values...
          </CardContent>
        </Card>
      ) : mlOutput ? (
        <>
          {bestModelName && (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-amber-500/10">
                    <Trophy className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Best Model</p>
                    <p className="text-xl font-bold">{bestModelName}</p>
                    <div className="flex gap-2 mt-1">
                      {bestModelCv !== null && (
                        <Badge variant="outline">CV: {bestModelCv}</Badge>
                      )}
                      {bestModelAcc !== null && (
                        <Badge variant="outline">Acc: {bestModelAcc}</Badge>
                      )}
                      {bestModelF1 !== null && (
                        <Badge variant="outline">F1: {bestModelF1}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features && features.length > 0 ? (
              <FeatureImportanceChart data={features} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Feature Importance</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No feature importance data available." />
                </CardContent>
              </Card>
            )}
            {models && models.length > 0 ? (
              <ModelComparisonChart data={models} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Model Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No model comparison data available." />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics && metrics.length > 0 ? (
              <MetricsRadar data={metrics} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No metrics data available." />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>SHAP Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {shapSummary && shapSummary.length > 0 ? (
                  <div className="space-y-2">
                    {shapSummary.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-mono w-32 truncate">
                          {f.feature}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(f.mean_abs_shap / (shapSummary[0]?.mean_abs_shap ?? 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {f.mean_abs_shap.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : features && features.length > 0 ? (
                  // Fallback to feature importance if SHAP summary not in expected format
                  <div className="space-y-2">
                    {features.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-mono w-32 truncate">
                          {f.name}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(f.importance / (features[0]?.importance ?? 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {f.importance.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No SHAP summary available from the ML Engineer agent." />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="Run a pipeline to see ML results. The ML Engineer agent trains 5 models, selects the best one, and computes SHAP feature importance for your dataset." />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <FileQuestion className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
    </div>
  )
}
