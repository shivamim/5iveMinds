// ✅ FIXED: Match backend schemas.py exactly
export interface PipelineRunCreate {
  dataset_id: string;
  business_question: string;  // ✅ Was: goal?, query?
  hitl_agents?: string[];
  custom_config?: Record<string, any>;
}

export interface PipelineRunResponse {
  id: string;
  status: string;
  dataset_id?: string;
  dataset_name: string;
  business_question: string;
  started_at?: string;
  completed_at?: string;
  total_time_ms?: number;
  quality_score_avg?: number;
  run_metadata?: Record<string, any>;
}

// ✅ FIXED: Backend returns { run: PipelineRunResponse, executions: [], progress_percent }
export interface PipelineStatusResponse {
  run: PipelineRunResponse;
  executions: AgentExecution[];
  progress_percent: number;
  // Backward-compat aliases for old frontend code
  status?: string;
  pipeline_status?: string;
  error?: string;
}

export interface AgentExecution {
  id: string;
  agent_name: string;
  status: string;
  quality_score?: number;
  execution_time_ms?: number;
  output_data?: any;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

// ✅ FIXED: Backend returns { run, executions (dict), charts, reports }
export interface PipelineResults {
  run: PipelineRunResponse;
  executions: Record<string, any>;  // keyed by agent_name
  charts: any[];
  reports: any[];
  // Backward-compat alias
  agent_outputs?: any;
  summary?: string;
  report?: string;
}

export interface DatasetUploadResponse {
  id: string;
  dataset_id?: string;
  filename: string;
  row_count?: number;
  column_count?: number;
  file_size_bytes?: number;
  dataset_schema?: Record<string, any>;
  uploaded_at?: string;
}

export interface DataEngineerOutput {
  row_count?: number;
  column_count?: number;
  missing_values_pct?: string;
  outliers_detected?: number;
  schema?: Record<string, any>;
  imputation_log?: any[];
  outlier_details?: any[];
}

// Dummy exports to satisfy imports
export type TokenResponse = any;
export type UserLogin = any;
export type UserRegister = any;
export type User = any;
export type DatasetPreview = any;
export type Dataset = any;
export type ChartItem = any;
export type ReportItem = any;
export type ExportRequest = any;
export type AgentInfo = any;
