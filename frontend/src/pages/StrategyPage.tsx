/**
 * Strategy Page
 */
import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbulb, Target, ListTodo, Shield, AlertTriangle, ShieldAlert, FileUp, BarChart3 } from 'lucide-react'

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

export default function StrategyPage() {
  const { getAgentOutput, currentRun } = useStore()
  const [fetching, setFetching] = useState(false)
  const [strategyData, setStrategyData] = useState<<Record<string, any> | null>(null)

  useEffect(() => {
    if (!currentRun?.id) return

    const loadData = async () => {
      const existing = getAgentOutput('strategist')
      if (existing && Object.keys(existing).length > 0) {
        setStrategyData(existing)
        return
      }

      setFetching(true)
      try {
        const res = await pipelineApi.getResults(currentRun.id)
        const executions = res.data?.executions || {}
        const stratOutput = parseOutputData(executions?.strategist)
        if (stratOutput) {
          setStrategyData(stratOutput)
        }
      } catch (err) {
        console.error('Failed to fetch from /results:', err)
        try {
          const res = await pipelineApi.getStatus(currentRun.id)
          const executions = res.data?.executions ?? []
          const stratExec = executions.find(
            (e: any) => e.agent_name === 'strategist' && e.output_data
          )
          const parsed = parseOutputData(stratExec?.output_data)
          if (parsed) {
            setStrategyData(parsed)
          }
        } catch (err2) {
          console.error('Failed to fetch from /status fallback:', err2)
        }
      } finally {
        setFetching(false)
      }
    }

    loadData()
    // CRITICAL FIX: Only depend on currentRun.id
  }, [currentRun?.id])

  const strategyOutput = useMemo(() => {
    if (strategyData) return strategyData
    return getAgentOutput('strategist') || {}
  }, [strategyData, getAgentOutput])

  const insights = useMemo(() => {
    const raw = strategyOutput.business_insights || strategyOutput.insights || []
    if (!Array.isArray(raw)) return []
    return raw.map((item: any) => {
      if (typeof item === 'string') return item
      return item.description || item.text || item.insight || JSON.stringify(item)
    }).filter((item: string) => item && item.length > 0)
  }, [strategyOutput])

  const actions = useMemo(() => {
    let raw = strategyOutput.recommended_actions || []
    if (!Array.isArray(raw) || raw.length === 0) {
      raw = strategyOutput.recommendations || []
    }

    if ((!Array.isArray(raw) || raw.length === 0) && insights.length > 0) {
      return insights.slice(0, 3).map((insight: string, i: number) => ({
        action: `Action ${i + 1}: ${insight.substring(0, 60)}${insight.length > 60 ? '...' : ''}`,
        description: insight,
        priority: i === 0 ? 'High' : 'Medium',
        timeline: 'TBD',
        expected_impact: 'Derived from analysis insight',
      }))
    }

    if (!Array.isArray(raw)) return []

    return raw.map((a: any, i: number) => {
      if (typeof a === 'string') {
        return {
          action: `Action ${i + 1}`,
          description: a,
          priority: 'Medium',
          timeline: 'TBD',
          expected_impact: '',
        }
      }
      const actionTitle = a.action
        || a.title
        || a.recommendation
        || a.name
        || `Action ${i + 1}`

      return {
        action: actionTitle,
        description: a.description || a.reason || a.impact || a.details || '',
        priority: a.priority || a.urgency || 'Medium',
        timeline: a.timeline || a.timeframe || a.deadline || 'TBD',
        expected_impact: a.expected_impact || a.expected_outcome || a.outcome || '',
      }
    })
  }, [strategyOutput, insights])

  const roi = strategyOutput.roi_projection || {}
  const risks = strategyOutput.risk_matrix || []
  const scenarios = strategyOutput.scenario_simulations || {}
  const qualityScore = strategyOutput.quality_score
  const executiveSummary = strategyOutput.executive_summary || ''

  const swot = useMemo(() => {
    const defaultSwot = {
      strengths: insights.filter((i: string) =>
        i.toLowerCase().includes('strong') ||
        i.toLowerCase().includes('quality') ||
        i.toLowerCase().includes('good') ||
        i.toLowerCase().includes('high')
      ),
      weaknesses: insights.filter((i: string) =>
        i.toLowerCase().includes('weak') ||
        i.toLowerCase().includes('missing') ||
        i.toLowerCase().includes('cleanup') ||
        i.toLowerCase().includes('poor')
      ),
      opportunities: insights.filter((i: string) =>
        i.toLowerCase().includes('opportunit') ||
        i.toLowerCase().includes('predict') ||
        i.toLowerCase().includes('feature') ||
        i.toLowerCase().includes('improve')
      ),
      threats: risks.map((r: any) => r.risk || r.threat || '').filter((r: string) => r.length > 0),
    }
    return strategyOutput.swot || defaultSwot
  }, [strategyOutput, insights, risks])

  const hasData = insights.length > 0
    || actions.length > 0
    || executiveSummary
    || Object.keys(roi).length > 0

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
          {fetching ? 'Fetching results from server...' : 'The Strategist is generating business insights and recommendations.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Strategy</h1>
        <p className="text-muted-foreground">Business insights, action items, and strategic recommendations</p>
        <p className="text-sm text-muted-foreground mt-1">Analysis for: {currentRun.dataset_name}</p>
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
                <p className="text-muted-foreground text-center py-8">No insights available.</p>
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

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No actions available.</p>
              ) : (
                actions.map((action: any, idx: number) => (
                  <Card key={idx} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{action.action}</h4>
                        <Badge variant={
                          action.priority?.toLowerCase() === 'high' ? 'destructive' :
                          action.priority?.toLowerCase() === 'medium' ? 'secondary' : 'outline'
                        }>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">Timeline: {action.timeline}</Badge>
                        {action.expected_impact && (
                          <Badge variant="outline">Impact: {action.expected_impact}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swot" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.strengths.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No strengths identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-green-500">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.weaknesses.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No weaknesses identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-yellow-500">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.opportunities.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No opportunities identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.opportunities.map((o: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-blue-500">→</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swot.threats.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No threats identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {swot.threats.map((t: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-red-500">×</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ROI Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(roi).length === 0 && Object.keys(scenarios).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No ROI projection data available.</p>
              ) : (
                <div className="space-y-4">
                  {Object.keys(roi).length > 0 && (
                    <div className="grid gap-4 md:grid-cols-3">
                      {Object.entries(roi).map(([key, value]: [string, any]) => (
                        <Card key={key}>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-2xl font-bold">{typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {Object.keys(scenarios).length > 0 && (
                    <div className="grid gap-4 md:grid-cols-3">
                      {Object.entries(scenarios).map(([key, value]: [string, any]) => (
                        <Card key={key}>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-2xl font-bold">{typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {risks.map((risk: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{risk.risk || risk.name || `Risk ${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground">{risk.description || risk.impact || ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          risk.likelihood?.toLowerCase() === 'high' ? 'destructive' :
                          risk.likelihood?.toLowerCase() === 'medium' ? 'secondary' : 'outline'
                        }>
                          {risk.likelihood || 'N/A'}
                        </Badge>
                        <Badge variant={
                          risk.impact?.toLowerCase() === 'high' ? 'destructive' :
                          risk.impact?.toLowerCase() === 'medium' ? 'secondary' : 'outline'
                        }>
                          {risk.impact || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
