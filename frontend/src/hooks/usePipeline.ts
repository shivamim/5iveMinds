import { useState, useEffect, useCallback, useRef } from 'react';
import type { PipelineStatusResponse, PipelineResults, AgentExecution } from '@/types';
import { getPipelineStatus, getPipelineResults } from '@/services/api';

interface UsePipelineOptions {
  runId: string | null;
  pollInterval?: number;
  autoFetch?: boolean;
}

interface UsePipelineReturn {
  status: PipelineStatusResponse | null;
  results: PipelineResults | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isComplete: boolean;
}

export function usePipeline({ runId, pollInterval = 3000, autoFetch = true }: UsePipelineOptions): UsePipelineReturn {
  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const [results, setResults] = useState<PipelineResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!runId) return;
    try {
      setLoading(true);
      setError(null);
      const statusData = await getPipelineStatus(runId);
      setStatus(statusData);

      // If pipeline is complete or failed, fetch full results
      if (statusData.run.status === 'completed' || statusData.run.status === 'failed') {
        const resultsData = await getPipelineResults(runId);
        setResults(resultsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipeline data');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (!runId || !autoFetch) return;

    fetchData();

    intervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runId, autoFetch, pollInterval, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const isComplete = status?.run.status === 'completed' || status?.run.status === 'failed';

  return { status, results, loading, error, refresh, isComplete };
}

// Helper to get agent output data from results
export function getAgentOutput(
  results: PipelineResults | null,
  agentName: string
): Record<string, unknown> | null {
  if (!results?.executions) return null;
  const output = results.executions[agentName];
  if (!output || typeof output !== 'object') return null;
  return output as Record<string, unknown>;
}

// Helper to get agent execution from status
export function getAgentExecution(
  status: PipelineStatusResponse | null,
  agentName: string
): AgentExecution | null {
  if (!status?.executions) return null;
  return status.executions.find(e => e.agent_name === agentName) || null;
}

// Helper to get charts by type
export function getChartsByType(
  results: PipelineResults | null,
  chartType: string
): Array<Record<string, unknown>> {
  if (!results?.charts) return [];
  return results.charts
    .filter(c => c.chart_type === chartType)
    .map(c => c.chart_data);
}

// Helper to get a specific chart
export function getChart(
  results: PipelineResults | null,
  chartType: string
): ChartItem | null {
  if (!results?.charts) return null;
  const chart = results.charts.find(c => c.chart_type === chartType);
  return chart || null;
}

import type { ChartItem } from '@/types';
