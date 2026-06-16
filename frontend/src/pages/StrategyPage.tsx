import { useEffect, useState } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbulb, Target, ListTodo, Shield, AlertTriangle, ShieldAlert, FileUp, BarChart3 } from 'lucide-react'

export default function StrategyPage() {
  const { getAgentOutput, currentRun, setAgentExecutions } = useStore()
  const [fetching, setFetching] = useState(false)

  // CRITICAL FIX: Fetch data independently so this page works even if user
  // navigates directly via URL or refreshes
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
  }, [currentRun?.id])

  const strategyOutput = getAgentOutput('strategist') || {}

  // CRITICAL FIX: Handle all possible data shapes from backend
  const insights = strategyOutput.business_insights || []
  const actions = strategyOutput.recommended_actions || []
  const roi = strategyOutput.roi_projection || {}
  const risks = strategyOutput.risk_matrix || []
  const scenarios = strategyOutput.scenario_simulations || {}
  const qualityScore = strategyOutput.quality_score
  const executiveSummary = strategyOutput.executive_summary || ''

  // Build SWOT from available data
  const swot = strategyOutput.swot || {
    strengths: insights.filter((i: string) => i.toLowerCase().includes('strong') || i.toLowerCase().includes('quality')),
    weaknesses: insights.filter((i: string) => i.toLowerCase().includes('weak') || i.toLowerCase().includes('missing') || i.toLowerCase().includes('cleanup')),
    opportunities: insights.filter((i: string) => i.toLowerCase().includes('opportunit') || i.toLowerCase().includes('predict') || i.toLowerCase().includes('feature')),
    threats: risks.map((r: any) => r.risk)
  }

  // Check if we have meaningful data
  const hasData = insights.length > 0 || actions.length > 0 || executiveSummary

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis from the Dashboard to see strategy results.</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lightbulb className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Waiting for Strategist...</h2>
        <p className="text-muted-foreground">
          {fetching
            ? 'Fetching results from server...'
            : 'The Strategist is generating business insights and recommendations.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Strategy</h1>
        <p className="text-muted-foreground">
          Business insights, action items, and strategic recommendations
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Analysis for: {currentRun.dataset_name}
        </p>
      </div>

      {executiveSummary && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Executive Summary</p>
            <p className="text-base leading-relaxed">{executiveSummary}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline">{insights.length} insights</Badge>
        <Badge variant="outline">{actions.length} actions</Badge>
        <Badge variant="outline">Quality: {qualityScore ?? 'N/A'}</Badge>
        {strategyOutput.llm_powered && <Badge>LLM Powered</Badge>}
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="swot">SWOT</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No business insights generated.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recommended actions generated.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{action.action}</h4>
                          <Badge variant={
                            action.priority === 'High' ? 'destructive' :
                            action.priority === 'Medium' ? 'secondary' : 'outline'
                          }>
                            {action.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="h-4 w-4" />
                          Timeline: {action.timeline || 'TBD'}
                        </div>
                        {action.expected_impact && (
                          <p className="mt-2 text-sm text-green-600">{action.expected_impact}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SWOT Tab */}
        <TabsContent value="swot" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.strengths?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No strengths identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-green-500">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.weaknesses?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No weaknesses identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-yellow-500">!</span> {w}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.opportunities?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No opportunities identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.opportunities.map((o: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-blue-500">→</span> {o}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.threats?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No threats identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.threats.map((t: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-red-500">⚠</span> {t}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ROI Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Conservative</div>
                  <div className="text-2xl font-bold text-yellow-500">{roi.conservative || 'N/A'}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Moderate</div>
                  <div className="text-2xl font-bold text-blue-500">{roi.moderate || 'N/A'}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Optimistic</div>
                  <div className="text-2xl font-bold text-green-500">{roi.optimistic || 'N/A'}</div>
                </div>
              </div>
              {scenarios.best_case && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Scenario Multipliers</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>Best: <Badge variant="default">{scenarios.best_case}x</Badge></span>
                    <span>Base: <Badge variant="secondary">{scenarios.base_case}x</Badge></span>
                    <span>Worst: <Badge variant="outline">{scenarios.worst_case}x</Badge></span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Risk Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No risks identified.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {risks.map((risk: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{risk.risk}</span>
                      <div className="flex gap-2">
                        <Badge variant={
                          risk.likelihood === 'High' ? 'destructive' :
                          risk.likelihood === 'Medium' ? 'secondary' : 'outline'
                        }>
                          Likelihood: {risk.likelihood}
                        </Badge>
                        <Badge variant={
                          risk.impact === 'High' ? 'destructive' :
                          risk.impact === 'Medium' ? 'secondary' : 'outline'
                        }>
                          Impact: {risk.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
