import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

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
  const wsBase = API_URL.replace(/^https?/, (m: string) => (m === 'https' ? 'wss' : 'ws'))
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
  upload: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
  },
  list: () => api.get('/datasets'),
  preview: (id: string, limit = 100) =>
    api.get(`/datasets/${id}/preview?row_limit=${limit}`),
  delete: (id: string) => api.delete(`/datasets/${id}`),
}

export const reportApi = {
  generate: (data: { run_id: string; format?: string }) =>
    api.post('/reports/generate', data),
  get: (reportId: string) => api.get(`/reports/${reportId}`),
}

export const chartApi = {
  getData: (datasetId: string, chartType: string) =>
    api.get(`/charts/${datasetId}/${chartType}`),
  getAllCharts: (runId: string) =>
    api.get(`/charts/${runId}`),
}
