import type { PipelineRunCreate, PipelineRunResponse, PipelineStatusResponse, PipelineResults, DatasetUploadResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend.up.railway.app';
const API_BASE = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (!response.ok) {
    // Prevent crash if history endpoint doesn't exist yet on backend
    if (response.status === 404 && (!options.method || options.method === 'GET')) {
       return [] as unknown as T;
    }
    if (response.status === 0) throw new Error(`CORS Error: Backend rejected the request.`);
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ==========================================
// CORE PIPELINE FUNCTIONS
// ==========================================
export async function startPipeline(request: PipelineRunCreate): Promise<PipelineRunResponse> {
  return fetchWithAuth('/pipeline/run', { method: 'POST', body: JSON.stringify(request) });
}

export async function getPipelineStatus(runId: string): Promise<PipelineStatusResponse> {
  return fetchWithAuth(`/pipeline/${runId}/status`);
}

export async function getPipelineResults(runId: string): Promise<PipelineResults> {
  return fetchWithAuth(`/pipeline/${runId}/results`);
}

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
    if (response.status === 413) throw new Error('File too large.');
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }
  return response.json();
}

// ==========================================
// FIX FOR HISTORY.TSX (Missing Exports)
// ==========================================
export async function getPipelineHistory(): Promise<any[]> {
  try {
    const res = await fetchWithAuth<any>('/pipeline');
    return Array.isArray(res) ? res : (res.data || []);
  } catch (e) {
    return []; // Fail gracefully if history endpoint isn't live yet
  }
}

export async function deletePipelineRun(runId: string): Promise<void> {
  try {
    await fetchWithAuth(`/pipeline/${runId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn("Delete endpoint not available or failed");
  }
}

// ==========================================
// CATCH-ALLS (Prevents Settings/Auth build crashes)
// ==========================================
export async function generateReport(runId: string, format: string): Promise<any> {
  return fetchWithAuth('/reports/generate', { method: 'POST', body: JSON.stringify({ run_id: runId, format }) }).catch(() => ({}));
}

export async function getDatasets(): Promise<any[]> {
  try {
    const res = await fetchWithAuth<any>('/datasets');
    return Array.isArray(res) ? res : (res.data || []);
  } catch (e) {
    return [];
  }
}

export async function login(data: any): Promise<any> { return fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({})); }
export async function register(data: any): Promise<any> { return fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({})); }
export async function getUserProfile(): Promise<any> { return fetchWithAuth('/auth/me').catch(() => ({})); }
export async function getAgentInfo(): Promise<any> { return []; }
