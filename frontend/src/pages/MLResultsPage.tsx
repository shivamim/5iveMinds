import { useEffect, useState } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Trophy, BarChart3, Zap, FileUp } from 'lucide-react'

export default function MLResultsPage() {
  const { getAgentOutput, currentRun, setAgentExecutions } = useStore()
  const [fetching, setFetching] = useState(false)

  // CRITICAL FIX: Fetch data independently so this page works even if user
  // navigates directly via URL or refreshes
  useEffect(() => {
    if (!currentRun?.id) return

    const loadData = async () => {
      const existing = getAgentOutput('ml_engineer')
      if (existing && Object.keys(existing).length > 0) return

      setFetching(true)
      try {
        const res = await pipelineApi.getStatus(currentRun.id)
        const executions = res.data?.executions ?? []
        if (executions.length > 0) {
          setAgentExecutions(executions)
        }
      } catch (err) {
        console.error('Failed to fetch agent data:', err)
      } finally {
        setFetching(false)
      }
    }

    loadData()
  }, [currentRun?.id])

  const mlOutput = getAgentOutput('ml_engineer') || {}

  // CRITICAL FIX: Handle all possible data shapes from backend
  const bestModel = mlOutput.best_model || 'N/A'
  const bestR2 = mlOutput.best_r2
  const bestRmse = mlOutput.best_rmse
  const featureImportance = mlOutput.feature_importance || {}
  const modelsEvaluated = mlOutput.models_evaluated || []
  const qualityScore = mlOutput.quality_score
  const shapSummary = mlOutput.shap_summary || {}

  const features = Object.entries(featureImportance)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)

  // Check if we have meaningful data
  const hasData = bestModel !== 'N/A' || features.length > 0 || modelsEvaluated.length > 0

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis from the Dashboard to see ML results.</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Brain className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Waiting for ML Engineer...</h2>
        <p className="text-muted-foreground">
          {fetching
            ? 'Fetching results from server...'
            : 'The ML Engineer is training and comparing models.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ML Results</h1>
        <p className="text-muted-foreground">
          AutoML model selection and SHAP explainability
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Best Model Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Best Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{bestModel}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">R² = {bestR2 ?? 'N/A'}</Badge>
              <Badge variant="outline">RMSE = {bestRmse ?? 'N/A'}</Badge>
              <Badge variant="outline">Quality: {qualityScore ?? 'N/A'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Selected as the top-performing model across {modelsEvaluated.length} candidates.
            </p>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {features.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No feature importance data available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {features.map(([name, importance], idx) => {
                  const pct = (importance as number) * 100
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{name}</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Model Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modelsEvaluated.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No model comparison data available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {modelsEvaluated.map((model: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{model.name}</span>
                      <p className="text-xs text-muted-foreground">{model.reason || model.suitable_for || ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">R²={model.r2 ?? 'N/A'}</Badge>
                      <Badge variant="outline">RMSE={model.rmse ?? 'N/A'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SHAP Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              SHAP Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(shapSummary).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No SHAP summary available from the ML Engineer agent.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(shapSummary).map(([feature, data]: [string, any]) => (
                  <div key={feature} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">{feature}</span>
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-500">+{data.positive?.toFixed?.(3) ?? data.positive ?? 0}</span>
                      <span className="text-red-500">{data.negative?.toFixed?.(3) ?? data.negative ?? 0}</span>
                      {data.importance && (
                        <Badge variant="outline" className="text-xs">
                          {data.importance?.toFixed?.(3) ?? data.importance}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
