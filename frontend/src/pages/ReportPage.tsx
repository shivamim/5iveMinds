import { useState } from 'react'
import { useStore } from '@/stores/appStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  Globe,
  FileQuestion,
} from 'lucide-react'

export function ReportPage() {
  const [exporting, setExporting] = useState<string | null>(null)
  // FIXED: Read strategist output from store instead of hardcoded data
  const getAgentOutput = useStore((s) => s.getAgentOutput)
  const agentExecutions = useStore((s) => s.agentExecutions)
  const currentRun = useStore((s) => s.currentRun)

  const strategistOutput = getAgentOutput('strategist')
  const execution = agentExecutions.find((e) => e.agent_name === 'strategist')

  const handleExport = async (format: string) => {
    setExporting(format)
    // TODO: Call export API when backend supports it
    setTimeout(() => setExporting(null), 2000)
  }

  // Try to get report content from multiple possible output formats
  const reportContent =
    (strategistOutput?.executive_summary as string) ??
    (strategistOutput?.report as string) ??
    (strategistOutput?.content as string) ??
    (strategistOutput?.insights
      ? JSON.stringify(strategistOutput.insights, null, 2)
      : null)

  const findings = strategistOutput?.key_findings as
    | Array<{ title: string; description: string; impact?: string }>
    | null
  const recommendations = strategistOutput?.recommendations as
    | Array<{
        title: string
        description: string
        priority?: string
        roi?: string
      }>
    | null
  const businessImpact = strategistOutput?.business_impact as
    | Record<string, string>
    | null
  const modelPerformance = strategistOutput?.model_performance as
    | Array<{ metric: string; score: number | string; target: string; status: string }>
    | null

  // Format raw content for display
  const formatContent = (content: string): string => {
    if (!content) return ''
    // If it's already markdown-like, return as-is
    if (content.includes('#') || content.includes('|') || content.includes('- ')) {
      return content
    }
    // Otherwise wrap it
    return content
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Report</h1>
          <p className="text-muted-foreground">
            Generated boardroom-ready analytics report
          </p>
          {currentRun && (
            <p className="text-xs text-muted-foreground mt-1">
              Dataset: {currentRun.dataset_name} | Question:{' '}
              {currentRun.business_question}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel'}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pptx')}
            disabled={exporting === 'pptx'}
          >
            <Presentation className="h-4 w-4 mr-2" />
            PPTX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('html')}
            disabled={exporting === 'html'}
          >
            <Globe className="h-4 w-4 mr-2" />
            HTML
          </Button>
        </div>
      </div>

      {execution?.status === 'running' ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Generating executive report...
          </CardContent>
        </Card>
      ) : strategistOutput ? (
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            {findings && findings.length > 0 && (
              <TabsTrigger value="findings">Key Findings</TabsTrigger>
            )}
            {recommendations && recommendations.length > 0 && (
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            )}
            {businessImpact && Object.keys(businessImpact).length > 0 && (
              <TabsTrigger value="impact">Business Impact</TabsTrigger>
            )}
            {modelPerformance && modelPerformance.length > 0 && (
              <TabsTrigger value="performance">Model Performance</TabsTrigger>
            )}
            {reportContent && (
              <TabsTrigger value="raw">Raw Output</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {reportContent ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans bg-muted p-4 rounded-lg">
                      {formatContent(reportContent)}
                    </pre>
                  </div>
                ) : (
                  <EmptyState message="No executive summary available from the strategist agent." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {findings && findings.length > 0 && (
            <TabsContent value="findings" className="space-y-4">
              {findings.map((finding, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg">{finding.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {finding.description}
                    </p>
                    {finding.impact && (
                      <Badge variant="outline" className="mt-3">
                        Impact: {finding.impact}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {recommendations && recommendations.length > 0 && (
            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.map((rec, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
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
            </TabsContent>
          )}

          {businessImpact && Object.keys(businessImpact).length > 0 && (
            <TabsContent value="impact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(businessImpact).map(([key, value], i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <span className="font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-emerald-500 font-mono">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {modelPerformance && modelPerformance.length > 0 && (
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Metric</th>
                          <th className="text-left py-3 px-4 font-medium">Score</th>
                          <th className="text-left py-3 px-4 font-medium">Target</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelPerformance.map((m, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-3 px-4 font-medium">{m.metric}</td>
                            <td className="py-3 px-4 font-mono">
                              {typeof m.score === 'number' ? m.score.toFixed(2) : m.score}
                            </td>
                            <td className="py-3 px-4 font-mono">{m.target}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  m.status?.toLowerCase().includes('exceed') ||
                                  m.status?.toLowerCase().includes('pass')
                                    ? 'default'
                                    : 'destructive'
                                }
                              >
                                {m.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {reportContent && (
            <TabsContent value="raw" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Agent Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                    {JSON.stringify(strategistOutput, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="Run a pipeline to see the executive report. The Strategist agent analyzes all agent outputs and generates business insights, recommendations, and ROI projections tailored to your dataset." />
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
