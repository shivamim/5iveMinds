import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

/** Convert HTTP(S) API URL to WebSocket URL for a pipeline run */
export function getPipelineWsUrl(runId: string): string {
  const wsBase = API_URL.replace(/^https?/, (m) => (m === 'https' ? 'wss' : 'ws'))
  return `${wsBase}/api/v1/pipeline/${runId}/ws`
}

export const pipelineApi = {
  start: (data: { dataset_id: string; business_question: string }) =>
    api.post('/pipeline/run', data),
  getStatus: (runId: string) => api.get(`/pipeline/${runId}/status`),
  getResults: (runId: string) => api.get(`/pipeline/${runId}/results`),
  getLogs: (runId: string) => api.get(`/pipeline/${runId}/logs`),
  getHistory: (limit = 20, offset = 0) =>
    api.get(`/pipeline/history?limit=${limit}&offset=${offset}`),
  delete: (runId: string) => api.delete(`/pipeline/${runId}`),
}

export const datasetApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: () => api.get('/datasets'),
  preview: (id: string, limit = 100) =>
    api.get(`/datasets/${id}/preview?row_limit=${limit}`),
  delete: (id: string) => api.delete(`/datasets/${id}`),
}

export const chartApi = {
  getAll: (runId: string) => api.get(`/charts/${runId}`),
  getByType: (runId: string, type: string) => api.get(`/charts/${runId}/${type}`),
}

export const reportApi = {
  get: (runId: string, type = 'executive') =>
    api.get(`/reports/${runId}?report_type=${type}`),
  export: (runId: string, format: string) =>
    api.post(`/reports/${runId}/export`, { format, sections: ['all'] }),
}

export const agentApi = {
  list: () => api.get('/agents'),
  getConfig: (name: string) => api.get(`/agents/${name}/config`),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
}
