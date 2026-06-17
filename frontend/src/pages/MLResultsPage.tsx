

import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Brain, Trophy, Zap, FileUp } from 'lucide-react'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']

/**
 * CRITICAL FIX: Parse output_data that may arrive as a JSON string
 * from the backend instead of a parsed object.
 */
function parseOutputData(data: any): Record<string, any> | null {
  if (data === null || data === undefined) return null
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      if (typeof parsed === 'object' && parsed !== null) return parsed
    } catch { /* not valid JSON */ }
    return null
  }
  if (typeof data === 'object') return data
  return null
}

export default function MLResultsPage() {
  const { getAgentOutput, currentRun, setAgentExecutions, agentExecutions, chartsData } = useStore()
  const [fetching, setFetching] = useState(false)
  const [mlOutput, setMlOutput] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (!currentRun?.id) return

    const loadData = async () => {
      // Check store first
      const existing = getAgentOutput('ml_engineer')
      if (existing && Object.keys(existing).length > 0) {
        setMlOutput(existing)
        return
      }

      // CRITICAL FIX: Fetch from /results endpoint for normalized output_data
      setFetching(true)
      try {
        const res = await pipelineApi.getResults(currentRun.id)
        const executions = res.data?.executions || {}
        const executionArray = Object.entries(executions).map(([agent_name, output_data]) => ({
          agent_name,
          output_data: parseOutputData(output_data) || output_data,
          status: 'completed',
        }))

        if (executionArray.length > 0) {
          setAgentExecutions(executionArray)
          const mlEngineerOutput = parseOutputData(executions?.ml_engineer)
          if (mlEngineerOutput) {
            setMlOutput(mlEngineerOutput)
          }
        }
      } catch (err) {
        console.error('Failed to fetch ML data from /results:', err)
        // Fallback to /status
        try {
          const res = await pipelineApi.getStatus(currentRun.id)
          const executions = res.data?.executions ?? []
          if (executions.length > 0) {
            setAgentExecutions(executions)
            const mlExec = executions.find(
              (e: any) => e.agent_name === 'ml_engineer' && e.output_data
            )
            const parsed = parseOutputData(mlExec?.output_data)
            if (parsed) {
              setMlOutput(parsed)
            }
          }
        } catch (err2) {
          console.error('Failed to fetch from /status fallback:', err2)
        }
      } finally {
        setFetching(false)
      }
    }

    loadData()
    // CRITICAL FIX: Re-run when agentExecutions changes in the store
  }, [currentRun?.id, agentExecutions, setAgentExecutions, getAgentOutput])

  // Get output from store or local state
  const mlEngineerOutput = useMemo(() => {
    if (mlOutput) return mlOutput
    return getAgentOutput('ml_engineer') || {}
  }, [mlOutput, agentExecutions, getAgentOutput])

  // CRITICAL FIX: Also check charts data from /results for feature importance
  const chartsFeatureImportance = useMemo(() => {
    const fiChart = chartsData.find((c: any) => c.chart_type === 'feature_importance')
    return fiChart?.chart_data || null
  }, [chartsData])

  // Also check designer output for feature importance fallback
  const designerOutput = useMemo(() => getAgentOutput('designer') || {}, [agentExecutions, getAgentOutput])
  const designerFeatureImportance = useMemo(() => {
    const specs = designerOutput?.chart_specs || []
    const fiSpec = specs.find((s: any) => s.type === 'feature_importance')
    return fiSpec?.data || null
  }, [designerOutput])

  // Extract all data with fallbacks
  // CRITICAL FIX: Check chartsData first, then designer output, then ml_engineer output
  const fiFromCharts = chartsFeatureImportance?.raw || chartsFeatureImportance?.features || null
  const bestModel = mlEngineerOutput.best_model || 'N/A'
  const bestR2 = mlEngineerOutput.best_r2
  const bestRmse = mlEngineerOutput.best_rmse
  const featureImportance = fiFromCharts || mlEngineerOutput.feature_importance || designerFeatureImportance || {}
  const modelsEvaluated = mlEngineerOutput.models_evaluated || []
  const qualityScore = mlEngineerOutput.quality_score
  const shapSummary = mlEngineerOutput.shap_summary || mlEngineerOutput.shap_values || {}
  const dataProfile = mlEngineerOutput.data_profile || {}

  // Prepare feature importance data for chart
  const featureImportanceData = useMemo(() => {
    return Object.entries(featureImportance)
      .map(([name, value]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        importance: Number(value) || 0,
        percentage: (Number(value) || 0) * 100,
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
  }, [featureImportance])

  // Prepare SHAP data
  const shapData = useMemo(() => {
    return Object.entries(shapSummary)
      .map(([feature, data]: [string, any]) => ({
        feature: feature.length > 20 ? feature.substring(0, 20) + '...' : feature,
        fullFeature: feature,
        positive: Number(data?.positive) || 0,
        negative: Number(data?.negative) || 0,
        importance: Number(data?.importance) || 0,
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
  }, [shapSummary])

  // CRITICAL FIX: More lenient hasData check
  const hasData = bestModel !== 'N/A'
    || featureImportanceData.length > 0
    || modelsEvaluated.length > 0
    || shapData.length > 0
    || Object.keys(dataProfile).length > 0

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
          {fetching ? 'Fetching results from server...' : 'The ML Engineer is training and comparing models.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ML Results</h1>
        <p className="text-muted-foreground">AutoML model selection and SHAP explainability</p>
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
              <Badge variant="outline">R2 = {bestR2 ?? 'N/A'}</Badge>
              <Badge variant="outline">RMSE = {bestRmse ?? 'N/A'}</Badge>
              <Badge variant="outline">Quality: {qualityScore ?? 'N/A'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Selected as the top-performing model across {modelsEvaluated.length || 1} candidates.
            </p>
            {dataProfile && (
              <div className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded">
                <div>Numeric features: {dataProfile.numeric_features ?? 'N/A'}</div>
                <div>Categorical features: {dataProfile.categorical_features ?? 'N/A'}</div>
                <div>Data quality: {dataProfile.data_quality_score ?? 'N/A'}/100</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Importance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {featureImportanceData.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <BarChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No feature importance data available.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...featureImportanceData].reverse()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [`${(Number(value) * 100).toFixed(1)}%`, 'Importance']}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                      {featureImportanceData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Comparison Card */}
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
                      <Badge variant="outline">R2={model.r2 ?? 'N/A'}</Badge>
                      <Badge variant="outline">RMSE={model.rmse ?? 'N/A'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SHAP Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              SHAP Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shapData.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No SHAP summary available from the ML Engineer agent.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...shapData].reverse()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="positive" stackId="shap" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="negative" stackId="shap" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
