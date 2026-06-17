import { create } from 'zustand'
import { PipelineRun, Dataset, AgentInfo, AgentExecution, Theme } from '@/types'

interface AppState {
  theme: Theme
  setTheme: (theme: Theme) => void

  currentRun: PipelineRun | null
  setCurrentRun: (run: PipelineRun | null) => void

  agentExecutions: AgentExecution[]
  setAgentExecutions: (executions: AgentExecution[]) => void
  getAgentOutput: (agentName: string) => Record<string, unknown> | null
  getAllAgentOutputs: () => Record<string, Record<string, unknown> | null>

  chartsData: Record<string, unknown>[]
  setChartsData: (charts: Record<string, unknown>[]) => void

  datasets: Dataset[]
  setDatasets: (datasets: Dataset[]) => void
  addDataset: (dataset: Dataset) => void

  agents: AgentInfo[]
  setAgents: (agents: AgentInfo[]) => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  user: { email: string; name?: string } | null
  setUser: (user: { email: string; name?: string } | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
}

export function normalizeStatus(status: unknown): string {
  if (status === null || status === undefined) return 'pending'
  if (typeof status === 'string') return status.toLowerCase()
  if (typeof status === 'object' && status !== null) {
    const s = status as Record<string, unknown>
    if (typeof s.value === 'string') return s.value.toLowerCase()
    if (typeof s.name === 'string') return s.name.toLowerCase()
  }
  return String(status).toLowerCase()
}

export function isStatusCompleted(status: unknown): boolean {
  return normalizeStatus(status) === 'completed'
}

export function isStatusFailed(status: unknown): boolean {
  return normalizeStatus(status) === 'failed'
}

export function isStatusRunning(status: unknown): boolean {
  const s = normalizeStatus(status)
  return s === 'running' || s === 'pending'
}

function safeOutputData(data: unknown): Record<string, unknown> | null {
  if (data === null || data === undefined) return null
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Not valid JSON
    }
    return null
  }
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

export const useStore = create<<AppState>((set, get) => ({
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

  agentExecutions: [],
  setAgentExecutions: (executions) => set({ agentExecutions: executions }),

  chartsData: [],
  setChartsData: (charts) => set({ chartsData: charts }),

  // CRITICAL FIX: Removed status filter. Return data if it exists.
  getAgentOutput: (agentName) => {
    const executions = get().agentExecutions
    const execution = executions.find((e) => e.agent_name === agentName)
    return safeOutputData(execution?.output_data ?? null)
  },

  getAllAgentOutputs: () => {
    const executions = get().agentExecutions
    const outputs: Record<string, Record<string, unknown> | null> = {}
    for (const e of executions) {
      if (e.output_data) {
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
