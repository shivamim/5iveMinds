import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Trash2, Play, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPipelineHistory, deletePipelineRun } from '@/services/api';

export function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getPipelineHistory();
        setHistory(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDelete = async (runId: string) => {
    if (!confirm('Are you sure you want to delete this run?')) return;
    await deletePipelineRun(runId);
    setHistory(history.filter(h => (h.id || h.run_id) !== runId));
  };

  const handleView = (runId: string) => {
    localStorage.setItem('lastRunId', runId);
    navigate(`/dashboard?run=${runId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Loading pipeline history...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-blue-600" /> Pipeline History
          </h1>
          <p className="text-muted-foreground mt-2">Review and manage your past data analysis runs.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No History Yet</h2>
            <p className="text-muted-foreground mb-6">Start a new analysis to see your pipeline runs here.</p>
            <Button onClick={() => navigate('/')}>Start New Analysis</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {history.map((run) => {
            const runId = run.id || run.run_id;
            const status = run.status || 'unknown';
            const date = run.created_at ? new Date(run.created_at).toLocaleString() : 'Unknown Date';
            
            return (
              <Card key={runId} className="hover:shadow-lg transition-shadow">
                <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Run: <span className="font-mono text-blue-600">{runId.substring(0, 8)}...</span></h3>
                      <Badge variant={status === 'completed' ? 'default' : 'secondary'} className={status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                        {status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {run.goal || run.query || 'No business question recorded.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(runId)}>
                      <Play className="w-4 h-4 mr-2" /> View Results
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(runId)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
