import type {
  TokenResponse,
  UserLogin,
  UserRegister,
  User,
  PipelineRunCreate,
  PipelineRunResponse,
  PipelineStatusResponse,
  PipelineResults,
  DatasetUploadResponse,
  DatasetPreview,
  Dataset,
  ChartItem,
  ReportItem,
  ExportRequest,
  AgentInfo,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ===== Helper =====
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ===== Auth =====
export async function login(credentials: UserLogin): Promise<TokenResponse> {
  return fetchWithAuth<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(credentials: UserRegister): Promise<TokenResponse> {
  return fetchWithAuth<TokenResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getCurrentUser(): Promise<User> {
  return fetchWithAuth<User>('/auth/me');
}

// ===== Pipeline =====
export async function startPipeline(request: PipelineRunCreate): Promise<PipelineRunResponse> {
  return fetchWithAuth<PipelineRunResponse>('/pipeline/run', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getPipelineStatus(runId: string): Promise<PipelineStatusResponse> {
  return fetchWithAuth<PipelineStatusResponse>(`/pipeline/${runId}/status`);
}

export async function getPipelineResults(runId: string): Promise<PipelineResults> {
  return fetchWithAuth<PipelineResults>(`/pipeline/${runId}/results`);
}

export async function getPipelineLogs(runId: string): Promise<Array<Record<string, unknown>>> {
  return fetchWithAuth<Array<Record<string, unknown>>>(`/pipeline/${runId}/logs`);
}

export async function getPipelineHistory(limit = 20, offset = 0): Promise<PipelineRunResponse[]> {
  return fetchWithAuth<PipelineRunResponse[]>(`/pipeline/history?limit=${limit}&offset=${offset}`);
}

export async function deletePipelineRun(runId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/pipeline/${runId}`, {
    method: 'DELETE',
  });
}

// ===== Datasets =====
export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function listDatasets(limit = 50, offset = 0): Promise<Dataset[]> {
  return fetchWithAuth<Dataset[]>(`/datasets?limit=${limit}&offset=${offset}`);
}

export async function getDatasetPreview(datasetId: string, rowLimit = 100): Promise<DatasetPreview> {
  return fetchWithAuth<DatasetPreview>(`/datasets/${datasetId}/preview?row_limit=${rowLimit}`);
}

export async function deleteDataset(datasetId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/datasets/${datasetId}`, {
    method: 'DELETE',
  });
}

// ===== Charts =====
export async function getCharts(runId: string): Promise<ChartItem[]> {
  return fetchWithAuth<ChartItem[]>(`/charts/${runId}`);
}

export async function getChartByType(runId: string, chartType: string): Promise<ChartItem> {
  return fetchWithAuth<ChartItem>(`/charts/${runId}/${chartType}`);
}

// ===== Reports =====
export async function getReport(runId: string, reportType: 'executive' | 'technical' | 'summary' = 'executive'): Promise<ReportItem> {
  return fetchWithAuth<ReportItem>(`/reports/${runId}?report_type=${reportType}`);
}

export async function exportReport(runId: string, request: ExportRequest): Promise<{ download_url: string; format: string }> {
  return fetchWithAuth<{ download_url: string; format: string }>(`/reports/${runId}/export`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ===== Agents =====
export async function listAgents(): Promise<AgentInfo[]> {
  return fetchWithAuth<AgentInfo[]>('/agents');
}

// ===== WebSocket =====
export function createPipelineWebSocket(runId: string): WebSocket {
  const wsUrl = API_BASE.replace(/^http/, 'ws');
  const token = localStorage.getItem('token');
  const ws = new WebSocket(`${wsUrl}/pipeline/${runId}/ws${token ? `?token=${token}` : ''}`);
  return ws;
}
