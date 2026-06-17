

import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Lightbulb, ListTodo, TrendingUp, Code } from 'lucide-react'

export default function ReportPage() {
  const { getAgentOutput, currentRun, setAgentExecutions, agentExecutions } = useStore()
  const [fetching, setFetching] = useState(false)
  const [allOutputs, setAllOutputs] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!currentRun?.id) return

    const loadData = async () => {
      // Check if we have strategist data in store
      const existing = getAgentOutput('strategist')
      if (existing && Object.keys(existing).length > 0) {
        setAllOutputs({
          strategist: existing,
          data_engineer: getAgentOutput('data_engineer') || {},
          statistician: getAgentOutput('statistician') || {},
          ml_engineer: getAgentOutput('ml_engineer') || {},
        })
        return
      }

      setFetching(true)
      try {
        const res = await pipelineApi.getStatus(currentRun.id)
        const executions = res.data?.executions ?? []
        if (executions.length > 0) {
          setAgentExecutions(executions)
          // Extract all outputs
          const outputs: Record<string, any> = {}
          for (const e of executions) {
            if (e.output_data && typeof e.output_data === 'object') {
              outputs[e.agent_name] = e.output_data
            }
          }
          setAllOutputs(outputs)
        }
      } catch (err) {
        console.error('Failed to fetch report data:', err)
      } finally {
        setFetching(false)
      }
    }

    loadData()
  }, [currentRun?.id, setAgentExecutions, getAgentOutput])

  // Get strategy output from local state or store
  const strategyOutput = useMemo(() => {
    return allOutputs.strategist || getAgentOutput('strategist') || {}
  }, [allOutputs, agentExecutions, getAgentOutput])

  const dataEngineerOutput = useMemo(() => {
    return allOutputs.data_engineer || getAgentOutput('data_engineer') || {}
  }, [allOutputs, agentExecutions, getAgentOutput])

  const statisticianOutput = useMemo(() => {
    return allOutputs.statistician || getAgentOutput('statistician') || {}
  }, [allOutputs, agentExecutions, getAgentOutput])

  const mlOutput = useMemo(() => {
    return allOutputs.ml_engineer || getAgentOutput('ml_engineer') || {}
  }, [allOutputs, agentExecutions, getAgentOutput])

  // Extract report data with fallbacks
  const executiveSummary = strategyOutput.executive_summary || ''
  const keyFindings = strategyOutput.key_findings || strategyOutput.business_insights || []
  const recommendations = strategyOutput.recommendations || strategyOutput.recommended_actions || []
  const businessImpact = strategyOutput.business_impact || strategyOutput.roi_projection || {}
  const qualityScore = dataEngineerOutput.quality_score || 'N/A'
  const bestModel = mlOutput.best_model || 'N/A'
  const bestR2 = mlOutput.best_r2 || 'N/A'

  // Build raw output for the Raw Output tab
  const rawOutput = useMemo(() => {
    return {
      strategy: strategyOutput,
      data_engineering: dataEngineerOutput,
      statistics: statisticianOutput,
      ml_results: mlOutput,
    }
  }, [strategyOutput, dataEngineerOutput, statisticianOutput, mlOutput])

  const hasData = executiveSummary || keyFindings.length > 0 || recommendations.length > 0

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileText className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis to generate a report.</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileText className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Generating Report...</h2>
        <p className="text-muted-foreground">
          {fetching ? 'Fetching results...' : 'Report data is being prepared.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Report</h1>
        <p className="text-muted-foreground">Generated boardroom-ready analytics report</p>
        <p className="text-sm text-muted-foreground mt-1">
          Dataset: {currentRun.dataset_name} | Question: {currentRun.business_question}
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="findings">Key Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="impact">Business Impact</TabsTrigger>
          <TabsTrigger value="raw">Raw Output</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executiveSummary ? (
                <p className="text-base leading-relaxed">{executiveSummary}</p>
              ) : (
                <p className="text-muted-foreground">No executive summary available.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">Data Quality: {qualityScore}/100</Badge>
                <Badge variant="outline">Best Model: {bestModel}</Badge>
                <Badge variant="outline">R2: {bestR2}</Badge>
                <Badge variant="outline">Insights: {keyFindings.length}</Badge>
                <Badge variant="outline">Recommendations: {recommendations.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(keyFindings) || keyFindings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No key findings available.</p>
              ) : (
                <div className="space-y-3">
                  {keyFindings.map((finding: any, idx: number) => {
                    const findingText = typeof finding === 'string' ? finding : (finding.text || finding.description || JSON.stringify(finding))
                    return (
                      <div key={idx} className="flex gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {idx + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{findingText}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(recommendations) || recommendations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recommendations available.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec: any, idx: number) => {
                    // Handle both { recommendation: ... } and { action: ... } formats
                    const title = rec.recommendation || rec.action || rec.title || `Recommendation ${idx + 1}`
                    const description = rec.description || rec.details || ''
                    const priority = rec.priority || 'Medium'
                    const timeline = rec.timeline || rec.timeframe || 'TBD'
                    const outcome = rec.expected_outcome || rec.expected_impact || ''

                    return (
                      <Card key={idx} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{title}</h4>
                            <Badge variant={
                              priority === 'High' ? 'destructive' :
                              priority === 'Medium' ? 'secondary' : 'outline'
                            }>
                              {priority}
                            </Badge>
                          </div>
                          {description && (
                            <p className="text-sm text-muted-foreground mb-2">{description}</p>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Timeline: {timeline}
                          </div>
                          {outcome && (
                            <p className="mt-2 text-sm text-green-600">{outcome}</p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Impact Tab */}
        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(businessImpact).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No business impact data available.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">Conservative</div>
                    <div className="text-2xl font-bold text-yellow-500">{businessImpact.conservative || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">Moderate</div>
                    <div className="text-2xl font-bold text-blue-500">{businessImpact.moderate || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">Optimistic</div>
                    <div className="text-2xl font-bold text-green-500">{businessImpact.optimistic || 'N/A'}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Output Tab */}
        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Raw Agent Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{JSON.stringify(rawOutput, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
