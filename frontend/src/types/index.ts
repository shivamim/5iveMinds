export interface PipelineRun {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  dataset_name: string;
  business_question: string;
  started_at?: string;
  completed_at?: string;
  total_time_ms?: number;
  quality_score_avg?: number;
  metadata?: Record<string, any>;
}

export interface AgentExecution {
  id: string;
  agent_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  quality_score?: number;
  execution_time_ms?: number;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface Dataset {
  id: string;
  filename: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  schema: Record<string, any>;
  uploaded_at: string;
}

export interface Chart {
  id: string;
  agent_name: string;
  chart_type: string;
  chart_data: Record<string, any>;
  plotly_spec?: Record<string, any>;
}

export interface AgentInfo {
  name: string;
  display_name: string;
  description: string;
  capabilities: string[];
  quality_dimensions: string[];
}

export interface PipelineProgress {
  type: 'agent_started' | 'agent_progress' | 'agent_completed' | 'agent_failed' | 'pipeline_completed';
  run_id: string;
  agent_name?: string;
  progress?: number;
  quality_score?: number;
  message: string;
  timestamp: string;
}

export type Theme = 'light' | 'dark' | 'system';
