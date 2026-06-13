import { useEffect, useState } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { AgentPipeline } from '@/components/agents/AgentCards'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Award, Activity } from 'lucide-react'
import { formatDuration, getQualityColor } from '@/lib/utils'

export function DashboardPage() {
  const currentRun = useStore((s) => s.currentRun)
  const [status, setStatus] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (!currentRun) return

    // Poll status
    const poll = setInterval(async () => {
      try {
        const res = await pipelineApi.getStatus(currentRun.id)
        setStatus(res.data)
      } catch (e) {
        console.error(e)
      }
    }, 2000)

    // WebSocket for real-time updates
    const wsUrl = `${import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/api/v1/pipeline/${currentRun.id}/ws`
    const socket = new WebSocket(wsUrl)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('WS Update:', data)
      // Refresh status on any update
      pipelineApi.getStatus(currentRun.id).then((res) => setStatus(res.data))
    }

    socket.onerror = (e) => console.error('WS Error:', e)
    setWs(socket)

    return () => {
      clearInterval(poll)
      socket.close()
    }
  }, [currentRun])

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Active Pipeline</h2>
        <p className="text-muted-foreground">Start a new analysis from the home page</p>
      </div>
    )
  }

  const run = status?.run || currentRun
  const executions = status?.executions || []
  const progress = status?.progress_percent || 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">
                  {run.total_time_ms ? formatDuration(run.total_time_ms) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className={`text-2xl font-bold ${getQualityColor(run.quality_score_avg || 0)}`}>
                  {run.quality_score_avg ? run.quality_score_avg.toFixed(1) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agents</p>
                <p className="text-2xl font-bold">
                  {executions.filter((e: any) => e.status === 'completed').length}/5
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={run.status === 'running' ? 'warning' : run.status === 'completed' ? 'success' : 'default'}>
                  {run.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} max={100} variant={progress === 100 ? 'success' : 'default'} />
          <p className="text-sm text-muted-foreground mt-2">{progress.toFixed(0)}% complete</p>
        </CardContent>
      </Card>

      {/* Agent Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Agent Execution</h2>
        <AgentPipeline executions={executions} />
      </div>
    </div>
  )
}
