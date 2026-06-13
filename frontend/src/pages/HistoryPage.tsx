import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { pipelineApi } from '@/lib/api'
import { PipelineRun } from '@/types'
import { Clock, Trash2, ArrowRight } from 'lucide-react'
import { formatDuration, getQualityColor } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function HistoryPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await pipelineApi.getHistory()
      setRuns(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pipelineApi.delete(id)
      setRuns(runs.filter(r => r.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading history...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline History</h1>
        <p className="text-muted-foreground">Previous analysis runs and results</p>
      </div>

      <div className="space-y-3">
        {runs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No pipeline runs yet. Start your first analysis!
            </CardContent>
          </Card>
        ) : (
          runs.map((run) => (
            <Card key={run.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{run.dataset_name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">{run.business_question}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={run.status === 'completed' ? 'success' : run.status === 'running' ? 'warning' : 'default'}>
                          {run.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(run.started_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getQualityColor(run.quality_score_avg || 0)}`}>
                        {run.quality_score_avg?.toFixed(1) || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{run.total_time_ms ? formatDuration(run.total_time_ms) : '—'}</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(run.id) }}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
