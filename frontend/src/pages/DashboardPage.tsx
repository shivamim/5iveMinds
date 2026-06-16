import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '@/stores/appStore'
import type { PipelineRun } from '@/types'
import { pipelineApi, getPipelineWsUrl } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Award, Activity, AlertCircle } from 'lucide-react'
import { formatDuration, getQualityColor } from '@/lib/utils'

interface Execution {
  id: string
  agent_name: string
  status: string
  execution_time_ms: number
  output_data?: Record<string, unknown>
}

interface RunStatus {
  run: {
    id: string
    status: string
    business_question: string
    total_time_ms: number
    quality_score_avg: number
  }
  executions: Execution[]
}

export function DashboardPage() {
  const currentRun = useStore((s) => s.currentRun)
  const setCurrentRun = useStore((s) => s.setCurrentRun)
  const setAgentExecutions = useStore((s) => s.setAgentExecutions)
  const [status, setStatus] = useState<RunStatus | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const currentRunRef = useRef<PipelineRun | null>(null)
  currentRunRef.current = currentRun

  const fetchStatus = useCallback(
    async (runId: string) => {
      try {
        const res = await pipelineApi.getStatus(runId)
        setStatus(res.data)
        // FIXED: Save agent executions to the store so tab pages can display real data
        if (res.data?.executions) {
          setAgentExecutions(res.data.executions)
        }
        if (res.data?.run && currentRunRef.current) {
          setCurrentRun({
            ...currentRunRef.current,
            status: res.data.run.status as PipelineRun['status'],
            total_time_ms: res.data.run.total_time_ms,
            quality_score_avg: res.data.run.quality_score_avg,
          })
        }
        setError(null)
      } catch (e: any) {
        console.error('Status poll error:', e)
        if (e.response?.status === 404) {
          setError('Pipeline run not found. It may have been deleted.')
        }
      }
    },
    [setCurrentRun, setAgentExecutions]
  )

  // WebSocket connection
  useEffect(() => {
    if (!currentRun?.id) return
    const runId = currentRun.id
    const wsUrl = getPipelineWsUrl(runId)
    console.log('Connecting to WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      setWsConnected(true)
      // Send initial ping to verify connection
      ws.send(JSON.stringify({ action: 'ping' }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'pong') return
        console.log('WebSocket message:', msg)

        if (msg.type === 'agent_completed' || msg.type === 'agent_progress' || msg.type === 'agent_failed') {
          fetchStatus(runId)
        }
        if (msg.type === 'pipeline_completed') {
          fetchStatus(runId)
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setWsConnected(false)
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      setWsConnected(false)
    }

    // Fallback polling every 3 seconds
    const pollInterval = setInterval(() => {
      fetchStatus(runId)
    }, 3000)

    // Initial fetch
    fetchStatus(runId)

    return () => {
      clearInterval(pollInterval)
      ws.close()
    }
  }, [currentRun?.id, fetchStatus])

  if (!currentRun) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your pipeline runs in real-time</p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No active pipeline run. Go to the home page to start an analysis.
          </CardContent>
        </Card>
      </div>
    )
  }

  const executions = status?.executions ?? []
  const totalExecutions = executions.length || 5
  const completedExecutions = executions.filter((e) => e.status === 'completed').length
  const progressPercent = Math.round((completedExecutions / totalExecutions) * 100)
  const isCompleted = currentRun.status === 'completed'
  const isFailed = currentRun.status === 'failed'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Pipeline run for {currentRun.dataset_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-sm text-muted-foreground">
            {wsConnected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                isCompleted
                  ? 'default'
                  : isFailed
                    ? 'destructive'
                    : currentRun.status === 'running'
                      ? 'secondary'
                      : 'outline'
              }
              className="text-lg px-3 py-1"
            >
              {currentRun.status}
            </Badge>
            {currentRun.started_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Started: {new Date(currentRun.started_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentRun.total_time_ms
                ? formatDuration(currentRun.total_time_ms)
                : isCompleted
                  ? 'Done'
                  : 'Running...'}
            </div>
            {currentRun.completed_at && currentRun.started_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(currentRun.started_at).toLocaleTimeString()} -{' '}
                {new Date(currentRun.completed_at).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentRun.quality_score_avg
                ? `${(currentRun.quality_score_avg * 100).toFixed(0)}%`
                : '—'}
            </div>
            {currentRun.quality_score_avg && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${getQualityColor(currentRun.quality_score_avg)}`} />
                <span className={`text-xs ${getQualityColor(currentRun.quality_score_avg)}`}>
                  {currentRun.quality_score_avg >= 0.8
                    ? 'Excellent'
                    : currentRun.quality_score_avg >= 0.6
                      ? 'Good'
                      : 'Needs Improvement'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{currentRun.business_question}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {completedExecutions} of {totalExecutions} agents completed
              </span>
              <span className="text-sm text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Agent Executions</h2>
        {executions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Waiting for agents to start...
            </CardContent>
          </Card>
        ) : (
          executions.map((execution, i) => (
            <motion.div
              key={execution.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          execution.status === 'completed'
                            ? 'bg-emerald-500'
                            : execution.status === 'running'
                              ? 'bg-blue-500 animate-pulse'
                              : execution.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-muted'
                        }`}
                      />
                      <span className="font-medium">{execution.agent_name}</span>
                    </div>
                    <Badge
                      variant={
                        execution.status === 'completed'
                          ? 'default'
                          : execution.status === 'running'
                            ? 'secondary'
                            : execution.status === 'failed'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {execution.status}
                    </Badge>
                  </div>
                  {execution.output_data && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {typeof execution.output_data === 'string'
                        ? execution.output_data
                        : JSON.stringify(execution.output_data).substring(0, 200)}
                    </p>
                  )}
                  {execution.execution_time_ms > 0 && (
                    <p className="text-xs text-muted-foreground ml-6 mt-1">
                      Duration: {formatDuration(execution.execution_time_ms)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
