import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Activity, Clock, BarChart3, ArrowRight, CheckCircle2,
  XCircle, Loader2, AlertCircle, TrendingUp, Database, Brain, Lightbulb
} from 'lucide-react'
import { Link } from 'react-router-dom'

// Agent icon mapping for the dashboard
const AGENT_ICONS: Record<string, React.ReactNode> = {
  data_engineer: <Database className="h-4 w-4" />,
  statistician: <TrendingUp className="h-4 w-4" />,
  ml_engineer: <Brain className="h-4 w-4" />,
  strategist: <Lightbulb className="h-4 w-4" />,
  designer: <BarChart3 className="h-4 w-4" />,
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  data_engineer: 'Data Engineer',
  statistician: 'Statistician',
  ml_engineer: 'ML Engineer',
  strategist: 'Strategist',
  designer: 'Designer',
}

export default function DashboardPage() {
  const {
    currentRun,
    setCurrentRun,
    setAgentExecutions,
  } = useStore()

  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // FIX: Wrap in useCallback to prevent stale closure in setInterval
  const fetchStatus = useCallback(async () => {
    if (!currentRun?.id) return

    try {
      const res = await pipelineApi.getStatus(currentRun.id)

      // FIX: Read from correct response structure: res.data.run.status (not res.data.status)
      const runData = res.data?.run ?? {}
      const executions = res.data?.executions ?? []
      const progressPercent = res.data?.progress_percent ?? 0

      // Build normalized status object for UI rendering
      const normalizedStatus = {
        ...res.data,
        // Flatten run fields for backward compatibility with UI
        status: runData.status ?? 'loading',
        quality_score_avg: runData.quality_score_avg,
        completed_at: runData.completed_at,
        started_at: runData.started_at,
        total_time_ms: runData.total_time_ms,
        dataset_name: runData.dataset_name,
        business_question: runData.business_question,
        // Keep executions and progress at top level too
        executions: executions,
        progress_percent: progressPercent,
      }

      setStatus(normalizedStatus)

      // CRITICAL: Save agent executions to global store so tab pages can access them
      if (executions.length > 0) {
        setAgentExecutions(executions)
      }

      // FIX: Use correct path to check if pipeline is done
      const pipelineStatus = runData.status
      if (pipelineStatus === 'completed' || pipelineStatus === 'failed') {
        setCurrentRun({
          ...currentRun,
          status: pipelineStatus,
          quality_score_avg: runData.quality_score_avg,
          completed_at: runData.completed_at,
        })

        // Stop polling when done
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Failed to fetch status:', err)
      setError(err.message || 'Failed to fetch pipeline status')
      setLoading(false)
    }
  }, [currentRun, setCurrentRun, setAgentExecutions])

  // Start polling when currentRun changes
  useEffect(() => {
    if (!currentRun?.id) return

    setLoading(true)
    setError(null)

    // Fetch immediately
    fetchStatus()

    // Then poll every 3 seconds
    intervalRef.current = setInterval(fetchStatus, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [currentRun?.id, fetchStatus])

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Active Pipeline</h2>
        <p className="text-muted-foreground">Upload a dataset and start an analysis to see results here.</p>
        <Button asChild>
          <Link to="/">Start New Analysis</Link>
        </Button>
      </div>
    )
  }

  const isCompleted = status?.status === 'completed'
  const isFailed = status?.status === 'failed'
  const isRunning = status?.status === 'running' || status?.status === 'queued'
  const executions = status?.executions || []
  const completedAgents = executions.filter((e: any) => e.status === 'completed').length
  const totalAgents = executions.length || 5

  // Calculate per-agent quality scores for transparency
  const agentScores = executions
    .filter((e: any) => e.quality_score !== null && e.quality_score !== undefined)
    .map((e: any) => ({
      name: e.agent_name,
      displayName: AGENT_DISPLAY_NAMES[e.agent_name] || e.agent_name,
      score: Math.round(e.quality_score),
      status: e.status,
    }))

  const overallQuality = status?.quality_score_avg
    ? Math.round(status.quality_score_avg)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Pipeline run for {currentRun.dataset_name}
          </p>
        </div>
        <Badge variant={isCompleted ? 'default' : isFailed ? 'destructive' : 'secondary'}>
          {status?.status || 'loading'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {isFailed && <XCircle className="h-5 w-5 text-red-500" />}
              {isRunning && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              <span className="text-2xl font-bold">{status?.status || '...'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Started: {currentRun.started_at ? new Date(currentRun.started_at).toLocaleString() : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.total_time_ms
                ? `${(status.total_time_ms / 1000).toFixed(1)}s`
                : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Quality</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallQuality !== null
                ? `${overallQuality}%`
                : '...'}
            </div>
            {overallQuality !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Average across {agentScores.length} agents
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-Agent Quality Scores - NEW: Shows transparent breakdown */}
      {agentScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Quality Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentScores.map((agent: any) => (
              <div key={agent.name} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-36">
                  {AGENT_ICONS[agent.name] || <Activity className="h-4 w-4" />}
                  <span className="text-sm font-medium">{agent.displayName}</span>
                </div>
                <div className="flex-1">
                  <Progress
                    value={agent.score}
                    className="h-2"
                  />
                </div>
                <div className="w-12 text-right">
                  <Badge
                    variant={agent.score >= 90 ? 'default' : agent.score >= 75 ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {agent.score}%
                  </Badge>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Overall Average</span>
                <span className="text-lg font-bold">{overallQuality}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overallQuality && overallQuality >= 90 ? 'Excellent - All agents performed well' :
                 overallQuality && overallQuality >= 75 ? 'Good - Minor areas for improvement' :
                 'Fair - Review agent outputs for issues'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{currentRun.business_question || 'N/A'}</p>
        </CardContent>
      </Card>

      {/* Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>{completedAgents} of {totalAgents} agents completed</span>
            <span>{Math.round((completedAgents / totalAgents) * 100)}%</span>
          </div>
          <Progress value={(completedAgents / totalAgents) * 100} />
        </CardContent>
      </Card>

      {/* Agent Executions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Agent Executions</h2>
        {executions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Waiting for agents to start...
            </CardContent>
          </Card>
        ) : (
          executions.map((execution: any) => (
            <Card key={execution.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {execution.status === 'completed' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {execution.status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {execution.status === 'running' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    <span className="font-medium capitalize">
                      {AGENT_DISPLAY_NAMES[execution.agent_name] || execution.agent_name}
                    </span>
                  </div>
                  <Badge variant={
                    execution.status === 'completed' ? 'default' :
                      execution.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {execution.status}
                  </Badge>
                </div>

                {execution.output_data && Object.keys(execution.output_data).length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {execution.output_data.quality_score !== undefined && (
                        <div>Quality: {execution.output_data.quality_score}/100</div>
                      )}
                      {execution.output_data.row_count !== undefined && (
                        <div>Rows: {execution.output_data.row_count}</div>
                      )}
                      {execution.output_data.column_count !== undefined && (
                        <div>Columns: {execution.output_data.column_count}</div>
                      )}
                      {execution.output_data.best_model && (
                        <div>Model: {execution.output_data.best_model}</div>
                      )}
                      {execution.output_data.best_r2 !== undefined && (
                        <div>R²: {execution.output_data.best_r2}</div>
                      )}
                      {execution.output_data.business_insights && (
                        <div>Insights: {execution.output_data.business_insights.length}</div>
                      )}
                    </div>
                  </div>
                )}

                {execution.error_message && (
                  <div className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                    {execution.error_message}
                  </div>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                  Duration: {execution.execution_time_ms
                    ? `${(execution.execution_time_ms / 1000).toFixed(1)}s`
                    : 'N/A'}
                  {execution.quality_score && ` | Quality: ${Math.round(execution.quality_score)}%`}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Navigation to Results */}
      {isCompleted && (
        <div className="flex flex-wrap gap-4">
          <Button asChild className="flex-1 min-w-[200px]">
            <Link to="/data-engineering">
              View Data Engineering <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="flex-1 min-w-[200px]" variant="outline">
            <Link to="/statistics">
              View Statistics <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="flex-1 min-w-[200px]" variant="outline">
            <Link to="/ml-results">
              View ML Results <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="flex-1 min-w-[200px]" variant="outline">
            <Link to="/strategy">
              View Strategy <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="flex-1 min-w-[200px]" variant="outline">
            <Link to="/report">
              View Report <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
