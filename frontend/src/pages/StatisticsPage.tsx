import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Activity, FlaskConical, FileUp } from 'lucide-react'

export default function StatisticsPage() {
  const { getAgentOutput, currentRun, setAgentExecutions, agentExecutions } = useStore()
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!currentRun?.id) return
    const loadData = async () => {
      const existing = getAgentOutput('statistician')
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

  const statisticianOutput = useMemo(() => getAgentOutput('statistician') || {}, [agentExecutions, getAgentOutput])

  const distributions = statisticianOutput.distributions || []
  const correlations = statisticianOutput.correlations || []
  const hypothesisTests = statisticianOutput.hypothesis_tests || []
  const insights = statisticianOutput.insights || []
  const qualityScore = statisticianOutput.quality_score
  const numericColumns = statisticianOutput.numeric_columns ?? statisticianOutput.key_statistics?.numeric_columns ?? 0
  const significantCorrelations = statisticianOutput.significant_correlations ?? 0

  const hasData = distributions.length > 0 || correlations.length > 0 || hypothesisTests.length > 0 || insights.length > 0

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis from the Dashboard to see statistical results.</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Activity className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Waiting for Statistician...</h2>
        <p className="text-muted-foreground">
          {fetching ? 'Fetching results from server...' : 'The Statistician agent is analyzing distributions, correlations, and hypothesis tests.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistical Analysis</h1>
        <p className="text-muted-foreground">EDA, distributions, hypothesis testing, and correlation analysis</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline">{numericColumns} numeric columns</Badge>
        <Badge variant="outline">{correlations.length} correlations</Badge>
        <Badge variant={significantCorrelations > 0 ? 'default' : 'secondary'}>
          {significantCorrelations} significant
        </Badge>
        <Badge variant="outline">Quality: {qualityScore ?? 'N/A'}</Badge>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
          <TabsTrigger value="hypothesis">Hypothesis Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Distribution Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distributions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No distribution data available from the statistician agent.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {distributions.map((dist: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{dist.column || `Column ${idx + 1}`}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="outline" className="capitalize">{dist.type || dist.distribution_type || 'unknown'}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mean:</span>
                            <span>{dist.mean?.toFixed?.(3) ?? dist.mean ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Std:</span>
                            <span>{dist.std?.toFixed?.(3) ?? dist.std ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Skewness:</span>
                            <span>{dist.skewness?.toFixed?.(3) ?? dist.skewness ?? 'N/A'}</span>
                          </div>
                          {dist.normality_test && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Normal:</span>
                              <Badge variant={dist.normality_test.p_value > 0.05 ? 'default' : 'secondary'}>
                                p={dist.normality_test.p_value?.toFixed?.(4) ?? 'N/A'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Correlation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {correlations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No correlations found in the dataset.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {correlations.map((corr: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{corr.var1}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="font-medium">{corr.var2}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          Math.abs(corr.correlation) > 0.7 ? 'text-green-500' :
                          Math.abs(corr.correlation) > 0.4 ? 'text-yellow-500' : 'text-muted-foreground'
                        }`}>
                          r = {corr.correlation?.toFixed?.(3) ?? corr.correlation}
                        </span>
                        {corr.p_value !== undefined && (
                          <Badge variant={corr.p_value < 0.05 ? 'default' : 'secondary'}>
                            p = {corr.p_value?.toFixed?.(4) ?? corr.p_value}
                          </Badge>
                        )}
                        {corr.significant && <Badge>Significant</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hypothesis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Hypothesis Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hypothesisTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hypothesis tests were run by the statistician agent.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hypothesisTests.map((test: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{test.name || test.test_name || `Test ${idx + 1}`}</h4>
                          <Badge variant={test.rejected ? 'default' : 'secondary'}>
                            {test.rejected ? 'Rejected' : 'Not Rejected'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Statistic:</span>{' '}
                            <span className="font-medium">{test.statistic?.toFixed?.(4) ?? test.statistic ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">p-value:</span>{' '}
                            <span className="font-medium">{test.p_value?.toFixed?.(4) ?? test.p_value ?? 'N/A'}</span>
                          </div>
                          {test.degrees_of_freedom && (
                            <div>
                              <span className="text-muted-foreground">df:</span>{' '}
                              <span>{test.degrees_of_freedom}</span>
                            </div>
                          )}
                          {test.effect_size && (
                            <div>
                              <span className="text-muted-foreground">Effect Size:</span>{' '}
                              <span>{test.effect_size?.toFixed?.(4) ?? test.effect_size}</span>
                            </div>
                          )}
                        </div>
                        {test.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{test.description}</p>
                        )}
                      </CardContent>
                    </Card>
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
