import { useState, useEffect } from 'react';
import { History, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPipelineHistory, deletePipelineRun } from '@/services/api';
import type { PipelineRunResponse } from '@/types';
import { useNavigate } from 'react-router-dom';

export function HistoryPage() {
  const [runs, setRuns] = useState<PipelineRunResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getPipelineHistory(50, 0);
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (runId: string) => {
    if (!confirm('Are you sure you want to delete this pipeline run?')) return;
    try {
      await deletePipelineRun(runId);
      setRuns(runs.filter((r) => r.id !== runId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleView = (runId: string) => {
    localStorage.setItem('lastRunId', runId);
    navigate(`/?run=${runId}`);
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <p className="text-gray-500 mt-1">View and manage past pipeline runs</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pipeline Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pipeline runs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Dataset</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Started</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Quality</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{run.dataset_name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{run.business_question}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            run.status === 'completed'
                              ? 'default'
                              : run.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(run.started_at)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDuration(run.total_time_ms)}</td>
                      <td className="py-3 px-4">
                        {run.quality_score_avg ? (
                          <span className={`font-medium ${run.quality_score_avg >= 90 ? 'text-green-600' : run.quality_score_avg >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                            {run.quality_score_avg.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(run.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(run.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
