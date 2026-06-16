import { useStore } from '@/stores/appStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DistributionChart, CorrelationHeatmap } from '@/components/charts'
import { FileQuestion } from 'lucide-react'

export function StatisticsPage() {
  // FIXED: Read statistician output from store instead of hardcoded data
  const getAgentOutput = useStore((s) => s.getAgentOutput)
  const agentExecutions = useStore((s) => s.agentExecutions)

  const statOutput = getAgentOutput('statistician')
  const execution = agentExecutions.find((e) => e.agent_name === 'statistician')

  // Parse distribution data from agent output
  const distData = statOutput?.distributions as
    | Array<{ bin: string; count: number }>
    | null
  const corrData = statOutput?.correlations as
    | Array<{ x: string; y: string; value: number }>
    | null
  const hypothesisTests = statOutput?.hypothesis_tests as
    | Array<{
        test: string
        variables: string[]
        p_value: number
        significant: boolean
      }>
    | null
  const summaryStats = statOutput?.summary_statistics as Record<
    string,
    unknown
  > | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistical Analysis</h1>
        <p className="text-muted-foreground">
          EDA, distributions, hypothesis testing, and correlation analysis
        </p>
      </div>

      {execution?.status === 'running' ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Running statistical analysis...
          </CardContent>
        </Card>
      ) : statOutput ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {distData && distData.length > 0 ? (
              <DistributionChart data={distData} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No distribution data available from the statistician agent." />
                </CardContent>
              </Card>
            )}
            {corrData && corrData.length > 0 ? (
              <CorrelationHeatmap data={corrData} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Correlations</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No correlation data available from the statistician agent." />
                </CardContent>
              </Card>
            )}
          </div>

          {hypothesisTests && hypothesisTests.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Hypothesis Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hypothesisTests.map((test, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <span className="font-medium">
                        {test.test}: {test.variables?.join(' vs ')}
                      </span>
                      <span
                        className={`font-mono ${
                          test.significant ? 'text-emerald-500' : 'text-amber-500'
                        }`}
                      >
                        p = {typeof test.p_value === 'number' ? test.p_value.toFixed(3) : test.p_value}{' '}
                        {test.significant ? '(significant)' : '(not significant)'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Hypothesis Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState message="No hypothesis tests were run by the statistician agent." />
              </CardContent>
            </Card>
          )}

          {summaryStats && Object.keys(summaryStats).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Column</th>
                        {Object.keys(summaryStats[Object.keys(summaryStats)[0]] as Record<string, unknown> || {}).map((key) => (
                          <th key={key} className="text-left py-3 px-4 font-medium capitalize">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summaryStats).map(([col, stats], i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-4 font-mono">{col}</td>
                          {Object.values(stats as Record<string, unknown>).map((val, j) => (
                            <td key={j} className="py-3 px-4 font-mono">
                              {typeof val === 'number' ? val.toFixed(2) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="Run a pipeline to see statistical analysis results. The Statistician agent will perform EDA, calculate correlations, and run hypothesis tests on your dataset." />
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
