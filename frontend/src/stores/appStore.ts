

import { create } from 'zustand'
import { PipelineRun, Dataset, AgentInfo, AgentExecution, Theme } from '@/types'

interface AppState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Pipeline
  currentRun: PipelineRun | null
  setCurrentRun: (run: PipelineRun | null) => void

  // Agent Executions - populated from DashboardPage polling
  agentExecutions: AgentExecution[]
  setAgentExecutions: (executions: AgentExecution[]) => void
  // Helper to get output_data for a specific agent
  getAgentOutput: (agentName: string) => Record<string, unknown> | null
  // Helper to get all outputs
  getAllAgentOutputs: () => Record<string, Record<string, unknown> | null>

  // Charts - populated from /results or /charts endpoint
  chartsData: Record<string, unknown>[]
  setChartsData: (charts: Record<string, unknown>[]) => void

  // Datasets
  datasets: Dataset[]
  setDatasets: (datasets: Dataset[]) => void
  addDataset: (dataset: Dataset) => void

  // Agents
  agents: AgentInfo[]
  setAgents: (agents: AgentInfo[]) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Auth
  user: { email: string; name?: string } | null
  setUser: (user: { email: string; name?: string } | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
}

/**
 * CRITICAL FIX: Normalize any status value to a string.
 * The backend may return enum objects or strings depending on serialization path.
 */
export function normalizeStatus(status: unknown): string {
  if (status === null || status === undefined) return 'pending'
  if (typeof status === 'string') return status.toLowerCase()
  // Handle enum objects: { value: "completed", name: "COMPLETED" }
  if (typeof status === 'object' && status !== null) {
    const s = status as Record<string, unknown>
    if (typeof s.value === 'string') return s.value.toLowerCase()
    if (typeof s.name === 'string') return s.name.toLowerCase()
  }
  return String(status).toLowerCase()
}

/**
 * CRITICAL FIX: Check if a status represents a completed state.
 */
export function isStatusCompleted(status: unknown): boolean {
  return normalizeStatus(status) === 'completed'
}

/**
 * CRITICAL FIX: Check if a status represents a failed state.
 */
export function isStatusFailed(status: unknown): boolean {
  return normalizeStatus(status) === 'failed'
}

/**
 * CRITICAL FIX: Check if a status represents a running state.
 */
export function isStatusRunning(status: unknown): boolean {
  const s = normalizeStatus(status)
  return s === 'running' || s === 'pending'
}

/**
 * CRITICAL FIX: Safely get output_data from an execution.
 * Ensures the value is always a dict or null.
 * 
 * BUG FIX: Some PostgreSQL drivers return JSON columns as strings.
 * We now parse JSON strings back into objects.
 */
function safeOutputData(data: unknown): Record<string, unknown> | null {
  if (data === null || data === undefined) return null
  
  // CRITICAL FIX: Handle JSON strings from backend
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Not valid JSON, return null
    }
    return null
  }
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

export const useStore = create<AppState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme })
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    }
  },

  currentRun: null,
  setCurrentRun: (run) => set({ currentRun: run }),

  // Agent executions from the pipeline - populated by DashboardPage
  agentExecutions: [],
  setAgentExecutions: (executions) => set({ agentExecutions: executions }),

  // Charts data - populated from /results or /charts endpoint
  chartsData: [],
  setChartsData: (charts) => set({ chartsData: charts }),

  /**
   * CRITICAL FIX: getAgentOutput now normalizes status before comparing.
   * This handles both string statuses and enum object statuses from the backend.
   */
  getAgentOutput: (agentName) => {
    const executions = get().agentExecutions
    const execution = executions.find((e) => {
      const nameMatch = e.agent_name === agentName
      // Normalize status to handle both strings and enum objects
      const statusNormalized = normalizeStatus(e.status)
      const statusMatch = statusNormalized === 'completed'
      const hasData = e.output_data !== null && e.output_data !== undefined
      return nameMatch && statusMatch && hasData
    })
    return safeOutputData(execution?.output_data ?? null)
  },

  /**
   * NEW: Get all agent outputs at once.
   */
  getAllAgentOutputs: () => {
    const executions = get().agentExecutions
    const outputs: Record<string, Record<string, unknown> | null> = {}
    for (const e of executions) {
      if (isStatusCompleted(e.status) && e.output_data) {
        outputs[e.agent_name] = safeOutputData(e.output_data)
      }
    }
    return outputs
  },

  datasets: [],
  setDatasets: (datasets) => set({ datasets }),
  addDataset: (dataset) => set((state) => ({ datasets: [dataset, ...state.datasets] })),

  agents: [],
  setAgents: (agents) => set({ agents }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: false,
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
}))
