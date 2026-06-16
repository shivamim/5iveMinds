import { useStore } from '@/stores/appStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileQuestion, Lightbulb, Target, TrendingUp } from 'lucide-react'

export function StrategyPage() {
  // FIXED: Read strategist output from store instead of hardcoded data
  const getAgentOutput = useStore((s) => s.getAgentOutput)
  const agentExecutions = useStore((s) => s.agentExecutions)
  const currentRun = useStore((s) => s.currentRun)

  const strategistOutput = getAgentOutput('strategist')
  const execution = agentExecutions.find((e) => e.agent_name === 'strategist')

  const insights = strategistOutput?.insights as
    | Array<{ title: string; description: string; confidence?: number }>
    | null
  const actions = strategistOutput?.action_items as
    | Array<{
        action: string
        owner?: string
        timeline?: string
        priority?: string
      }>
    | null
  const recommendations = strategistOutput?.recommendations as
    | Array<{
        title: string
        description: string
        priority?: string
        roi?: string
      }>
    | null
  const swot = strategistOutput?.swot as {
    strengths?: string[]
    weaknesses?: string[]
    opportunities?: string[]
    threats?: string[]
  } | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strategy</h1>
        <p className="text-muted-foreground">
          Business insights, action items, and strategic recommendations
        </p>
        {currentRun && (
          <p className="text-xs text-muted-foreground mt-1">
            Analysis for: {currentRun.dataset_name}
          </p>
        )}
      </div>

      {execution?.status === 'running' ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Developing strategic recommendations...
          </CardContent>
        </Card>
      ) : strategistOutput ? (
        <>
          {insights && insights.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold">Key Insights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.confidence !== undefined && (
                        <Badge variant="outline" className="mt-3">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recommendations && recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h2 className="text-xl font-semibold">Recommendations</h2>
              </div>
              {recommendations.map((rec, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      {rec.priority && (
                        <Badge
                          variant={
                            rec.priority === 'High'
                              ? 'destructive'
                              : rec.priority === 'Medium'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {rec.priority}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                    {rec.roi && (
                      <p className="text-sm text-emerald-500 mt-2">
                        Projected ROI: {rec.roi}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {actions && actions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Action Items</h2>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {actions.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between p-3 rounded-lg bg-muted"
                      >
                        <div>
                          <p className="font-medium">{action.action}</p>
                          <div className="flex gap-2 mt-1">
                            {action.owner && (
                              <span className="text-xs text-muted-foreground">
                                Owner: {action.owner}
                              </span>
                            )}
                            {action.timeline && (
                              <span className="text-xs text-muted-foreground">
                                Timeline: {action.timeline}
                              </span>
                            )}
                          </div>
                        </div>
                        {action.priority && (
                          <Badge
                            variant={
                              action.priority === 'High'
                                ? 'destructive'
                                : action.priority === 'Medium'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {action.priority}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {swot &&
            (swot.strengths?.length ||
              swot.weaknesses?.length ||
              swot.opportunities?.length ||
              swot.threats?.length) && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">SWOT Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {swot.strengths && swot.strengths.length > 0 && (
                    <Card className="border-l-4 border-l-emerald-500">
                      <CardHeader>
                        <CardTitle className="text-base text-emerald-500">
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {swot.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {swot.weaknesses && swot.weaknesses.length > 0 && (
                    <Card className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <CardTitle className="text-base text-red-500">
                          Weaknesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {swot.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              {w}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {swot.opportunities && swot.opportunities.length > 0 && (
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-base text-blue-500">
                          Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {swot.opportunities.map((o, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              {o}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {swot.threats && swot.threats.length > 0 && (
                    <Card className="border-l-4 border-l-amber-500">
                      <CardHeader>
                        <CardTitle className="text-base text-amber-500">
                          Threats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {swot.threats.map((t, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="Run a pipeline to see strategic analysis. The Strategist agent extracts business insights, creates actionable recommendations, and performs SWOT analysis based on your data." />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
      <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
    </div>
  )
}
