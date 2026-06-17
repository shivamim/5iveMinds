// ===== Auth Types =====
export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  email: string;
  name: string;
  authenticated: boolean;
}

// ===== Pipeline Types =====
export interface PipelineRunCreate {
  dataset_id: string;
  business_question: string;
  hitl_agents?: string[];
  custom_config?: Record<string, unknown>;
}

export interface PipelineRun {
  id: string;
  status: string;
  dataset_id: string | null;
  dataset_name: string;
  business_question: string;
  started_at: string | null;
  completed_at: string | null;
  total_time_ms: number | null;
  quality_score_avg: number | null;
  run_metadata: Record<string, unknown> | null;
}

export interface PipelineRunResponse extends PipelineRun {}

export interface AgentExecution {
  id: string;
  agent_name: string;
  status: string;
  quality_score: number | null;
  execution_time_ms: number | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface PipelineStatusResponse {
  run: PipelineRun;
  executions: AgentExecution[];
  progress_percent: number;
}

export interface PipelineResults {
  run: PipelineRun;
  executions: Record<string, Record<string, unknown> | null>;
  charts: ChartItem[];
  reports: ReportItem[];
}

// ===== Dataset Types =====
export interface Dataset {
  id: string;
  filename: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface DatasetUploadResponse {
  id: string;
  filename: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  dataset_schema: Record<string, unknown>;
  uploaded_at: string;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
  sample_size: number;
}

// ===== Chart Types =====
export interface ChartItem {
  id: string;
  pipeline_run_id?: string;
  agent_name: string;
  chart_type: string;
  chart_data: Record<string, unknown>;
  plotly_spec?: Record<string, unknown>;
  generated_at?: string | null;
}

// ===== Report Types =====
export interface ReportItem {
  id: string;
  report_type: string;
  content: string;
  generated_at: string | null;
}

export interface ExportRequest {
  format: 'pdf' | 'excel' | 'pptx' | 'html';
  sections?: string[];
}

// ===== Agent Types =====
export interface AgentInfo {
  name: string;
  display_name: string;
  description: string;
  capabilities: string[];
  quality_dimensions: string[];
}

// ===== WebSocket Types =====
export interface PipelineProgressMessage {
  type: 'agent_started' | 'agent_progress' | 'agent_completed' | 'agent_failed' | 'pipeline_completed';
  run_id: string;
  agent_name?: string;
  progress?: number;
  quality_score?: number;
  message: string;
  timestamp?: string;
}

// ===== Agent Output Data Types =====
export interface DataEngineerOutput {
  quality_score?: number;
  schema_inferred?: boolean;
  row_count?: number;
  column_count?: number;
  columns_analyzed?: number;
  missing_values_pct?: number;
  missing_values_total?: number;
  outliers_detected?: number;
  outlier_details?: Array<Record<string, unknown>>;
  imputation_log?: Array<Record<string, unknown>>;
  schema?: Record<string, unknown>;
}

export interface CorrelationItem {
  var1: string;
  var2: string;
  correlation: number;
  p_value: number;
  significant: boolean;
}

export interface StatisticianOutput {
  quality_score?: number;
  distributions_analyzed?: number;
  numeric_columns?: number;
  significant_correlations?: number;
  correlations?: CorrelationItem[];
  insights?: string[];
  hypothesis_tests?: Array<Record<string, unknown>>;
}

export interface ModelEvaluated {
  name: string;
  rmse: number;
  r2: number;
  suitable_for: string;
  reason: string;
}

export interface MLEngineerOutput {
  quality_score?: number;
  best_model?: string;
  best_r2?: number;
  best_rmse?: number;
  models_evaluated?: ModelEvaluated[];
  feature_importance?: Record<string, number>;
}

export interface RiskItem {
  risk: string;
  likelihood: string;
  impact: string;
}

export interface RecommendedAction {
  action: string;
  priority: string;
  timeline: string;
}

export interface StrategistOutput {
  quality_score?: number;
  llm_powered?: boolean;
  business_insights?: string[];
  key_findings?: string[];
  roi_projection?: {
    conservative: string;
    moderate: string;
    optimistic: string;
  };
  risk_matrix?: RiskItem[];
  recommended_actions?: RecommendedAction[];
}

export interface DesignerOutput {
  quality_score?: number;
  charts_generated?: number;
  chart_specs?: Array<Record<string, unknown>>;
  report_generated?: boolean;
}
