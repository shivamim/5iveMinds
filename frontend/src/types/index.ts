export interface UserLogin { email: string; password?: string; }
export interface UserRegister { email: string; password?: string; name?: string; }
export interface TokenResponse { access_token: string; token_type: string; }
export interface User { id: string; email: string; name: string; }

export interface PipelineRunCreate {
  dataset_id: string;
  goal?: string;
  query?: string;
}

export interface PipelineRunResponse {
  id?: string;
  run_id?: string;
  status: string;
  created_at: string;
}

export interface AgentExecution {
  agent_name: string;
  status: string;
  started_at?: string;
  completed_at?: string;
}

export interface PipelineStatusResponse {
  run: PipelineRunResponse;
  executions: AgentExecution[];
}

export interface ChartItem {
  id?: string;
  chart_type: string;
  chart_data: any;
}

export interface PipelineResults {
  executions: Record<string, any>;
  charts?: ChartItem[];
}

export interface DataEngineerOutput {
  row_count?: number;
  column_count?: number;
  missing_values_pct?: number | string;
  outliers_detected?: number;
  schema?: Record<string, { type: string; nullable: boolean }>;
  imputation_log?: any[];
  outlier_details?: any[];
  columns_analyzed?: number;
}

export interface DatasetUploadResponse { id: string; dataset_id?: string; file_path?: string; }
export interface DatasetPreview { columns: string[]; rows: any[]; }
export interface Dataset { id: string; name: string; size: number; uploaded_at: string; }
export interface ReportItem { report_type: string; content: string; }
export interface ExportRequest { format: string; sections: string[]; }
export interface AgentInfo { id: string; name: string; description: string; }
