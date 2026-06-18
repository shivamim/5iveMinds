// src/services/api.ts
import type { PipelineRunCreate, PipelineRunResponse, PipelineStatusResponse, PipelineResults, DatasetUploadResponse } from '@/types';

// 1. Safely construct the base URL
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
    // Handle CORS or 404/500 errors gracefully
    if (response.status === 404) throw new Error(`Endpoint not found: ${url}. Check VITE_API_URL.`);
    if (response.status === 0) throw new Error(`CORS Error: Backend rejected the request. Check Railway CORS settings.`);
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
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
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 413) throw new Error('File too large. Max size is 50MB.');
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }
  return response.json();
}
