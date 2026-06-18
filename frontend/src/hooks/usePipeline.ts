import { useState, useEffect, useCallback } from 'react';
import { getPipelineStatus, getPipelineResults } from '@/services/api';

// ✅ FIXED: Read from executions dict OR agent_outputs array
export function getAgentOutput(results: any, agentId: string) {
  if (!results) return null;

  // Backend returns { executions: { agent_name: output_data } }
  const executions = results.executions || results.agent_outputs;
  if (!executions) return null;

  // Dictionary format (current backend)
  if (!Array.isArray(executions)) {
    return executions[agentId]
      || executions[agentId.replace(/-/g, '_')]
      || executions[agentId.replace(/_/g, '')]
      || null;
  }

  // Array format (legacy)
  const agent = executions.find(
    (a: any) => a.agent_name === agentId || a.agent_id === agentId || a.name === agentId
  );
  return agent?.output || agent?.result || agent?.output_data || agent?.data || null;
}

export function usePipeline({ runId, pollInterval = 3000, autoFetch = true }: {
  runId: string | null,
  pollInterval?: number,
  autoFetch?: boolean
}) {
  const [status, setStatus] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const fetchData = useCallback(async () => {
    if (!runId) return;
    try {
      const statusData = await getPipelineStatus(runId);
      setStatus(statusData);

      // ✅ FIXED: Backend wraps status inside { run: { status, ... } }
      const runObj = statusData.run || statusData;
      const pipelineStatus = (runObj.status || statusData.status || statusData.pipeline_status || '').toLowerCase();
      const terminalStates = ['completed', 'success', 'finished', 'failed', 'error', 'done'];

      if (terminalStates.includes(pipelineStatus)) {
        setIsComplete(true);
        if (['failed', 'error'].includes(pipelineStatus)) {
          setError(runObj.error || statusData.error || statusData.message || 'Pipeline failed');
        } else {
          // Fetch final results once complete
          const resultsData = await getPipelineResults(runId);
          setResults(resultsData);
        }
      }
    } catch (err: any) {
      console.error('[FiveMinds] Pipeline fetch error:', err);
      setError(err.message);
      setIsComplete(true); // Stop polling on hard network error
    }
  }, [runId]);

  useEffect(() => {
    if (!autoFetch || !runId) return;

    fetchData();
    const interval = setInterval(() => {
      if (!isComplete) fetchData();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [runId, autoFetch, isComplete, fetchData, pollInterval]);

  return { status, results, error, isComplete, refetch: fetchData };
}
