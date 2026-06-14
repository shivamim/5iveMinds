import { Card, CardContent } from '@/components/ui/card'
import { History, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { pipelineApi } from '@/lib/api'

interface Run {
  id: string
  status: string
  business_question: string
  started_at: string
  total_time_ms: number
}

export function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await pipelineApi.getHistory()
      const runsData = Array.isArray(res.data) ? res.data : (res.data?.runs || [])
      setRuns(runsData)
      setError(null)
    } catch (e: any) {
      console.error('Failed to fetch history:', e)
      setError('Failed to load history. Please check your API connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (runId: string) => {
    try {
      await pipelineApi.delete(runId)
      setRuns(runs.filter((r) => r.id !== runId))
    } catch (e) {
      console.error('Failed to delete run:', e)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline History</h1>
        <p className="text-muted-foreground">View and manage past pipeline runs</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5 text-red-500 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Loading history...
          </CardContent>
        </Card>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center text-muted-foreground">
            <History className="h-12 w-12 mb-4" />
            <p>No pipeline runs yet.</p>
            <p className="text-sm">Start your first analysis from the home page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{run.business_question}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className={`capitalize ${
                        run.status === 'completed' ? 'text-emerald-500' :
                        run.status === 'failed' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {run.status}
                      </span>
                      <span>{new Date(run.started_at).toLocaleDateString()}</span>
                      {run.total_time_ms > 0 && (
                        <span>{(run.total_time_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(run.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
