export interface PipelineRunCreate { dataset_id: string; goal?: string; query?: string; }
export interface PipelineRunResponse { id: string; run_id: string; status: string; }
export interface PipelineStatusResponse { status: string; pipeline_status: string; executions: any[]; error?: string; }
export interface PipelineResults { agent_outputs: any; charts: any[]; summary?: string; report?: string; }
export interface DatasetUploadResponse { id: string; dataset_id: string; filename: string; }
export interface DataEngineerOutput { 
  row_count?: number; 
  column_count?: number; 
  missing_values_pct?: string; 
  outliers_detected?: number; 
  schema?: Record<string, any>; 
  imputation_log?: any[]; 
  outlier_details?: any[]; 
}

// Dummy exports to satisfy api.ts imports and prevent TS build errors
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
