import type { PipelineRunCreate, PipelineRunResponse, PipelineStatusResponse, PipelineResults, DatasetUploadResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://5iveminds-production.up.railway.app';
const API_BASE = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

// DEBUG: Log once so you can verify in browser console
console.log('[FiveMinds] API_BASE =', API_BASE);

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (networkErr: any) {
    throw new Error(
      `Network error reaching backend at ${API_BASE}${url}. ` +
      `Check internet connection, CORS, or backend deployment status. ` +
      `Detail: ${networkErr?.message || networkErr}`
    );
  }

  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readErr: any) {
    throw new Error(`Failed to read response body: ${readErr?.message}`);
  }

  if (!response.ok) {
    if (response.status === 404 && (!options.method || options.method === 'GET')) {
      return [] as unknown as T;
    }
    let errorMessage = `Request failed (Status: ${response.status})`;
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        errorMessage = parsed.detail || parsed.message || parsed.error || rawText;
        if (Array.isArray(parsed.detail) && parsed.detail.length > 0) {
          const first = parsed.detail[0];
          errorMessage = `Validation error: ${first.msg || JSON.stringify(first)}`;
        }
      } catch {
        errorMessage = rawText.length > 200 ? `Server Error (${response.status})` : rawText;
      }
    }
    throw new Error(errorMessage);
  }

  if (!rawText || rawText.trim() === '') return {} as T;
  try {
    return JSON.parse(rawText) as T;
  } catch {
    return rawText as unknown as T;
  }
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

export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  if (!file) throw new Error('No file provided');
  if (file.size === 0) throw new Error('File is empty (0 bytes). Please select a valid CSV/XLSX file.');
  if (file.size > 50 * 1024 * 1024) throw new Error('File too large. Max size is 50MB.');

  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch (networkError: any) {
    throw new Error(
      `Network error: Could not reach backend at ${API_BASE}/datasets/upload. ` +
      `Check CORS, Railway deployment, or internet. Detail: ${networkError?.message || networkError}`
    );
  }

  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readErr: any) {
    throw new Error(`Failed to read upload response: ${readErr?.message}`);
  }

  if (!response.ok) {
    let errorMessage = `Upload failed (Status: ${response.status})`;
    if (rawText) {
      try {
        const parsedError = JSON.parse(rawText);
        if (Array.isArray(parsedError.detail) && parsedError.detail.length > 0) {
          errorMessage = `Validation: ${parsedError.detail[0].msg}`;
        } else {
          errorMessage = parsedError.detail || parsedError.message || rawText;
        }
      } catch {
        errorMessage = rawText.length > 200 ? `Server Error (${response.status})` : rawText;
      }
    }
    if (response.status === 413) errorMessage = 'File too large. Max size is 50MB.';
    if (response.status === 422) errorMessage = `Invalid file: ${errorMessage}`;
    if (response.status === 0) errorMessage = 'CORS blocked or network unreachable.';
    throw new Error(errorMessage);
  }

  if (!rawText || rawText.trim() === '') {
    throw new Error('Upload succeeded but backend returned empty response. Check backend logs.');
  }

  try {
    const parsed = JSON.parse(rawText);
    if (!parsed.id && !parsed.dataset_id) {
      throw new Error('Backend response missing dataset ID');
    }
    return {
      id: parsed.id || parsed.dataset_id,
      dataset_id: parsed.dataset_id || parsed.id,
      filename: parsed.filename || file.name,
      ...parsed,
    };
  } catch (parseErr: any) {
    throw new Error(`Backend returned invalid JSON: ${parseErr.message}. Raw: ${rawText.slice(0, 200)}`);
  }
}

export async function getPipelineHistory(): Promise<any[]> {
  try {
    const res = await fetchWithAuth<any>('/pipeline/history');
    return Array.isArray(res) ? res : (res.data || res.runs || []);
  } catch (e) {
    console.error('[FiveMinds] History fetch failed:', e);
    return [];
  }
}

export async function deletePipelineRun(runId: string): Promise<void> {
  try { await fetchWithAuth(`/pipeline/${runId}`, { method: 'DELETE' }); } catch (e) {
    console.error('[FiveMinds] Delete failed:', e);
  }
}

export async function generateReport(runId: string, format: string): Promise<any> {
  return fetchWithAuth(`/reports/${runId}/export`, {
    method: 'POST',
    body: JSON.stringify({ format, sections: ['all'] }),
  }).catch((e) => { console.error('[FiveMinds] Report gen failed:', e); return {}; });
}

export async function getDatasets(): Promise<any[]> {
  try {
    const res = await fetchWithAuth<any>('/datasets');
    return Array.isArray(res) ? res : (res.data || []);
  } catch (e) { return []; }
}

export async function login(data: any): Promise<any> { return fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({})); }
export async function register(data: any): Promise<any> { return fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({})); }
export async function getUserProfile(): Promise<any> { return fetchWithAuth('/auth/me').catch(() => ({})); }
export async function getAgentInfo(): Promise<any> { return []; }

// ==========================================
// 📄 PDF EXPORT FUNCTION (Fixes the current build crash)
// ==========================================
export async function downloadPdfReport(runId: string): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/reports/${runId}/pdf`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to download PDF: ${response.status} - ${errorText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FiveMinds_Report_${runId.substring(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
