export interface PipelineRun {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  business_question: string
  // FIXED: Added dataset_id to track which dataset was used
  dataset_id?: string
  dataset_name: string
  started_at?: string
  completed_at?: string
  total_time_ms?: number
  quality_score_avg?: number
}

export interface Dataset {
  id: string
  filename: string
  file_size_bytes: number
  row_count: number
  column_count: number
  uploaded_at?: string
}

export interface AgentInfo {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  progress: number
  message: string
}

export interface AgentExecution {
  id: string
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  quality_score?: number
  execution_time_ms?: number
  output_data?: Record<string, unknown>
  error_message?: string
  started_at?: string
  completed_at?: string
}

export type Theme = 'dark' | 'light' | 'system'
