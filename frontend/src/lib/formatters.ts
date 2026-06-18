export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return 'N/A';
  }
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}

export function getAgentExecution(status: any, agentName: string) {
  if (!status?.executions) return null;
  return status.executions.find((e: any) => e.agent_name === agentName) || null;
}

export function getAgentOutput(results: any, agentName: string) {
  if (!results?.executions) return null;
  return results.executions[agentName] || null;
}

export const AGENT_LABELS: Record<string, string> = {
  data_engineer: 'Data Engineer',
  statistician: 'Statistician',
  ml_engineer: 'ML Engineer',
  strategist: 'Strategist',
  designer: 'Designer',
};

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  data_engineer: 'Cleans data, infers schema, handles missing values & outliers',
  statistician: 'Runs correlations, hypothesis tests, distribution analysis',
  ml_engineer: 'Trains & compares ML models, extracts feature importance',
  strategist: 'Generates business insights, ROI projections & risk analysis',
  designer: 'Creates visualizations and compiles the executive report',
};
