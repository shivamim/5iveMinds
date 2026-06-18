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
  const rawText = await response.text();

  if (!response.ok) {
    if (response.status === 404 && (!options.method || options.method === 'GET')) return [] as unknown as T;
    
    let errorMessage = `Request failed (Status: ${response.status})`;
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        errorMessage = parsed.detail || parsed.message || rawText;
      } catch {
        errorMessage = rawText.length > 100 ? `Server Error (${response.status})` : rawText;
      }
    }
    throw new Error(errorMessage);
  }

  if (!rawText) return {} as T;
  try { return JSON.parse(rawText) as T; } catch { return rawText as unknown as T; }
}

export async function startPipeline(request: PipelineRunCreate): Promise<PipelineRunResponse> {
  return fetchWithAuth('/pipeline/run', { method: 'POST', body: JSON.stringify(request) });
}

export async function getPipelineStatus(runId: string): Promise<PipelineStatusResponse> {
  return fetchWithAuth(`/pipeline/${runId}/status`);
}

export async function getPipelineResults(runId: string): Promise<PipelineResults> {
  return fetchWithAuth(`/pipeline/${runId}/results`);
}

// ==========================================
// 🛡️ BULLETPROOF FILE UPLOAD FUNCTION
// ==========================================
export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append('file', file); // The key 'file' MUST match your FastAPI backend parameter
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}, // NEVER set Content-Type for FormData manually!
      body: formData,
    });

    const rawText = await response.text();

    if (!response.ok) {
      let errorMessage = `Upload failed (Status: ${response.status})`;
      if (rawText) {
        try {
          const parsedError = JSON.parse(rawText);
          errorMessage = parsedError.detail || parsedError.message || rawText;
        } catch {
          errorMessage = rawText.length > 100 ? `Server Error (${response.status})` : rawText;
        }
      }
      if (response.status === 413) errorMessage = 'File too large. Max size is 50MB.';
      if (response.status === 422) errorMessage = 'Invalid file format or backend parameter mismatch.';
      throw new Error(errorMessage);
    }

    if (!rawText) {
      return { id: 'success', dataset_id: 'success', filename: file.name } as any;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return { id: rawText, dataset_id: rawText, filename: file.name } as any;
    }

  } catch (networkError: any) {
    if (networkError.message?.includes('Failed to fetch')) {
      throw new Error('Network Error: Could not reach the backend. Check CORS or Railway deployment status.');
    }
    throw networkError;
  }
}

// ==========================================
// HISTORY & CATCH-ALLS
// ==========================================
export async function getPipelineHistory(): Promise<any[]> {
  try {
    const res = await fetchWithAuth<any>('/pipeline');
    return Array.isArray(res) ? res : (res.data || []);
  } catch (e) { return []; }
}

export async function deletePipelineRun(runId: string): Promise<void> {
  try { await fetchWithAuth(`/pipeline/${runId}`, { method: 'DELETE' }); } catch (e) {}
}

export async function generateReport(runId: string, format: string): Promise<any> { return fetchWithAuth('/reports/generate', { method: 'POST', body: JSON.stringify({ run_id: runId, format }) }).catch(() => ({})); }
export async function getDatasets(): Promise<any[]> { try { const res = await fetchWithAuth<any>('/datasets'); return Array.isArray(res) ? res : (res.data || []); } catch (e) { return []; } }
export async function login(data: any): Promise<any> { return fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({})); }
export async function register(data: any): Promise<any> { return fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({})); }
export async function getUserProfile(): Promise<any> { return fetchWithAuth('/auth/me').catch(() => ({})); }
export async function getAgentInfo(): Promise<any> { return []; }
