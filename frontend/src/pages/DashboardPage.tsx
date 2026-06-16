import { useEffect, useState, useRef } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Activity, Clock, BarChart3, ArrowRight, CheckCircle2, 
  XCircle, Loader2, AlertCircle 
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { 
    currentRun, 
    setCurrentRun, 
    setAgentExecutions,  // CRITICAL: This must be called to populate the store
    theme 
  } = useStore()
  
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<<ReturnType<<typeof setInterval> | null>(null)

  // Fetch pipeline status
  const fetchStatus = async () => {
    if (!currentRun?.id) return
    
    try {
      const res = await pipelineApi.getStatus(currentRun.id)
      setStatus(res.data)
      
      // CRITICAL FIX: Save agent executions to the global store
      // so that DataEngineeringPage, StatisticsPage, MLResultsPage, 
      // ReportPage, and StrategyPage can access them via getAgentOutput()
      if (res.data?.executions && Array.isArray(res.data.executions)) {
        setAgentExecutions(res.data.executions)
      }
      
      // Update currentRun if completed
      if (res.data?.status === 'completed' || res.data?.status === 'failed') {
        setCurrentRun({
          ...currentRun,
          status: res.data.status,
          quality_score_avg: res.data.quality_score_avg,
          completed_at: res.data.completed_at,
        })
        
        // Stop polling when done
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch status:', err)
      setError(err.message || 'Failed to fetch pipeline status')
    }
  }

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
      }
    }
  }, [currentRun?.id])

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
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.quality_score_avg 
                ? `${Math.round(status.quality_score_avg)}%` 
                : '...'}
            </div>
            {status?.quality_score_avg && (
              <p className="text-xs text-green-500 mt-1">
                {status.quality_score_avg >= 90 ? 'Excellent' : 
                 status.quality_score_avg >= 75 ? 'Good' : 'Fair'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
                    <span className="font-medium capitalize">{execution.agent_name}</span>
                  </div>
                  <Badge variant={
                    execution.status === 'completed' ? 'default' :
                    execution.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {execution.status}
                  </Badge>
                </div>
                
                {execution.output_data && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {JSON.stringify(execution.output_data).slice(0, 500)}
                      {JSON.stringify(execution.output_data).length > 500 ? '...' : ''}
                    </pre>
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
                  {execution.quality_score && ` | Quality: ${execution.quality_score}`}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Navigation to Results */}
      {isCompleted && (
        <div className="flex gap-4">
          <Button asChild className="flex-1">
            <Link to="/data-engineering">
              View Data Engineering <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="flex-1" variant="outline">
            <Link to="/statistics">
              View Statistics <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="flex-1" variant="outline">
            <Link to="/ml-results">
              View ML Results <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
