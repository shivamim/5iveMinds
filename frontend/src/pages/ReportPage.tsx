import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText, FileUp, Download } from 'lucide-react'

export default function ReportPage() {
  const { getAgentOutput, currentRun, setAgentExecutions, agentExecutions } = useStore()
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!currentRun?.id) return
    const loadData = async () => {
      const existing = getAgentOutput('strategist')
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
  }, [currentRun?.id, setAgentExecutions, getAgentOutput])

  const strategyOutput = useMemo(() => getAgentOutput('strategist') || {}, [agentExecutions, getAgentOutput])
  const dataQualityOutput = useMemo(() => getAgentOutput('data_engineer') || {}, [agentExecutions, getAgentOutput])
  const statsOutput = useMemo(() => getAgentOutput('statistician') || {}, [agentExecutions, getAgentOutput])
  const mlOutput = useMemo(() => getAgentOutput('ml_engineer') || {}, [agentExecutions, getAgentOutput])

  const executiveSummary = strategyOutput.executive_summary
    || (strategyOutput.business_insights?.[0] ? strategyOutput.business_insights[0] : '')
    || 'Analysis complete. Review the findings below.'

  const keyFindings = useMemo(() => {
    const raw = strategyOutput.key_findings || strategyOutput.business_insights || []
    return raw.map((item: any) => typeof item === 'string' ? item : item.description || item.text || JSON.stringify(item))
  }, [strategyOutput])

  const recommendations = useMemo(() => {
    const raw = strategyOutput.recommendations || strategyOutput.recommended_actions || []
    return raw.map((rec: any, i: number) => ({
      title: rec.action || rec.recommendation || rec.title || `Recommendation ${i + 1}`,
      description: rec.description || rec.reason || rec.impact || '',
      priority: rec.priority || rec.urgency || 'Normal',
      timeline: rec.timeline || rec.timeframe || 'TBD',
      expected_outcome: rec.expected_outcome || rec.expected_impact || '',
    }))
  }, [strategyOutput])

  const businessImpact = strategyOutput.business_impact || strategyOutput.roi_projection || {}

  const modelPerformance = useMemo(() => ({
    best_model: mlOutput?.best_model || 'N/A',
    r2: mlOutput?.best_r2 ?? 'N/A',
    rmse: mlOutput?.best_rmse ?? 'N/A',
    quality_score: mlOutput?.quality_score ?? 'N/A',
  }), [mlOutput])

  const hasStrategyData = strategyOutput && (
    strategyOutput.business_insights?.length > 0
    || strategyOutput.executive_summary
    || strategyOutput.recommended_actions?.length > 0
  )

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis from the Dashboard to see the executive report.</p>
      </div>
    )
  }

  if (!hasStrategyData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileText className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Waiting for Report...</h2>
        <p className="text-muted-foreground">
          {fetching ? 'Fetching results from server...' : 'The Strategist is compiling the executive report.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Report</h1>
          <p className="text-muted-foreground">Generated boardroom-ready analytics report</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dataset: {currentRun.dataset_name} | Question: {currentRun.business_question}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> Excel</Button>
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> PPTX</Button>
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> HTML</Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="findings">Key Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="impact">Business Impact</TabsTrigger>
          <TabsTrigger value="model">Model Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{executiveSummary}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Data Quality</div>
                  <div className="text-2xl font-bold">{dataQualityOutput?.quality_score ?? 'N/A'}/100</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Statistical Confidence</div>
                  <div className="text-2xl font-bold">{statsOutput?.significant_correlations || 0} correlations</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Model Performance</div>
                  <div className="text-2xl font-bold">R² = {mlOutput?.best_r2 ?? 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardHeader><CardTitle>Key Findings</CardTitle></CardHeader>
            <CardContent>
              {keyFindings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No key findings available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keyFindings.map((finding: string, idx: number) => (
                    <div key={idx} className="flex gap-3 p-4 bg-muted rounded-lg">
                      <Badge variant="default" className="flex-shrink-0 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <p className="text-sm leading-relaxed">{finding}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader><CardTitle>Strategic Recommendations</CardTitle></CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recommendations available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'secondary' : 'outline'}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Timeline: {rec.timeline}</p>
                        {rec.expected_outcome && (
                          <p className="mt-2 text-sm text-green-600">{rec.expected_outcome}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact">
          <Card>
            <CardHeader><CardTitle>Business Impact & ROI</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(businessImpact).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No business impact data available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-2">Conservative</div>
                      <div className="text-3xl font-bold text-yellow-500">{businessImpact.conservative || 'N/A'}</div>
                    </div>
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-2">Moderate</div>
                      <div className="text-3xl font-bold text-blue-500">{businessImpact.moderate || 'N/A'}</div>
                    </div>
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-2">Optimistic</div>
                      <div className="text-3xl font-bold text-green-500">{businessImpact.optimistic || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model">
          <Card>
            <CardHeader><CardTitle>Model Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Best Model</div>
                  <div className="text-xl font-bold">{modelPerformance.best_model}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">R² Score</div>
                  <div className="text-xl font-bold">{modelPerformance.r2}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">RMSE</div>
                  <div className="text-xl font-bold">{modelPerformance.rmse}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Quality Score</div>
                  <div className="text-xl font-bold">{modelPerformance.quality_score}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
