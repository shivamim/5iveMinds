export interface PipelineRun {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  business_question: string
  dataset_id: string
  created_at: string
  updated_at: string
  duration_ms?: number
  quality_score?: number
}

export interface Dataset {
  id: string
  name: string
  size: number
  rows: number
  columns: number
  created_at: string
}

export interface AgentInfo {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  progress: number
  message: string
}

export type Theme = 'dark' | 'light' | 'system'
