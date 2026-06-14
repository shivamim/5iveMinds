import { useEffect, useState, useRef } from 'react'
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
  const [status, setStatus] = useState<RunStatus | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!currentRun) return

    setError(null)

    // Poll status every 2 seconds
    const poll = setInterval(async () => {
      try {
        const res = await pipelineApi.getStatus(currentRun.id)
        setStatus(res.data)

        // Update global store so top nav badge updates
        if (res.data?.run) {
          setCurrentRun({
            ...currentRun,
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
    }, 2000)
    pollRef.current = poll

    // WebSocket for real-time updates
    try {
      const wsUrl = getPipelineWsUrl(currentRun.id)
      const socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log('WebSocket connected')
        setWsConnected(true)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WS Update:', data)
          // Refresh status on any update
          pipelineApi.getStatus(currentRun.id)
            .then((res) => {
              setStatus(res.data)

              // Update global store on WebSocket update too
              if (res.data?.run) {
                setCurrentRun({
                  ...currentRun,
                  status: res.data.run.status as PipelineRun['status'],
                  total_time_ms: res.data.run.total_time_ms,
                  quality_score_avg: res.data.run.quality_score_avg,
                })
              }

              setError(null)
            })
            .catch(console.error)
        } catch (e) {
          console.error('WS message parse error:', e)
        }
      }

      socket.onerror = (e) => {
        console.error('WS Error:', e)
        setWsConnected(false)
      }

      socket.onclose = () => {
        console.log('WebSocket closed')
        setWsConnected(false)
      }

      wsRef.current = socket
    } catch (e) {
      console.error('Failed to create WebSocket:', e)
    }

    return () => {
      clearInterval(poll)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [currentRun, setCurrentRun])

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
n        <h2 className="text-2xl font-bold mb-2">No Active Pipeline</h2>
        <p className="text-muted-foreground">
          Start a new analysis from the home page
        </p>
      </div>
    )
  }

  const run = status?.run || currentRun
  const executions = status?.executions || []
  const completedExecutions = executions.filter(e => e.status === 'completed').length
  const totalExecutions = executions.length || 5
  const progressPercent = Math.round((completedExecutions / totalExecutions) * 100)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pipeline Dashboard</h1>
          {wsConnected && (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
              Live
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">{run.business_question}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-red-500/30 bg-red-500/5 text-red-500">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold capitalize">{run.status}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">
                  {run.total_time_ms ? formatDuration(run.total_time_ms) : 'In progress'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className={`text-2xl font-bold ${getQualityColor(run.quality_score_avg || 0)}`}>
                  {run.quality_score_avg ? `${Math.round(run.quality_score_avg)}/100` : 'N/A'}
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{completedExecutions} of {totalExecutions} agents completed</span>
              <span className="text-sm text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Agent Executions */}
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
                      <div className={`
                        w-3 h-3 rounded-full
                        ${execution.status === 'completed' ? 'bg-emerald-500' :
                          execution.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          execution.status === 'failed' ? 'bg-red-500' :
                          'bg-muted'}
                      `} />
                      <span className="font-medium">{execution.agent_name}</span>
                    </div>
                    <Badge variant={
                      execution.status === 'completed' ? 'default' :
                      execution.status === 'running' ? 'secondary' :
                      execution.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
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
