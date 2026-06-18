import { useState, useEffect, useCallback } from 'react';
import { getPipelineStatus, getPipelineResults } from '@/services/api';

// Helper to extract specific agent data from the backend response
export function getAgentOutput(results: any, agentId: string) {
  if (!results || !results.agent_outputs) return null;
  
  // Backend might return an array of executions or a dictionary
  if (Array.isArray(results.agent_outputs)) {
    const agent = results.agent_outputs.find(
      (a: any) => a.agent_name === agentId || a.agent_id === agentId || a.name === agentId
    );
    return agent?.output || agent?.result || agent?.data || null;
  }
  
  // Dictionary format
  return results.agent_outputs[agentId] || results.agent_outputs[agentId.replace('_', '')] || null;
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
      
      // Map backend status strings to a boolean
      const pipelineStatus = (statusData.status || statusData.pipeline_status || '').toLowerCase();
      const terminalStates = ['completed', 'success', 'finished', 'failed', 'error', 'done'];
      
      if (terminalStates.includes(pipelineStatus)) {
        setIsComplete(true);
        if (['failed', 'error'].includes(pipelineStatus)) {
          setError(statusData.error || statusData.message || 'Pipeline failed');
        } else {
          // Fetch final results once complete
          const resultsData = await getPipelineResults(runId);
          setResults(resultsData);
        }
      }
    } catch (err: any) {
      console.error("Pipeline fetch error:", err);
      setError(err.message);
      setIsComplete(true); // Stop polling on hard network error
    }
  }, [runId]);

  useEffect(() => {
    if (!autoFetch || !runId) return;
    
    fetchData(); // Initial fetch
    const interval = setInterval(() => {
      if (!isComplete) fetchData();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [runId, autoFetch, isComplete, fetchData, pollInterval]);

  return { status, results, error, isComplete, refetch: fetchData };
}
