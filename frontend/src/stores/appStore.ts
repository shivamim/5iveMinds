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
  getAgentOutput: (agentName) => {
    const executions = get().agentExecutions
    const execution = executions.find(
      (e) => e.agent_name === agentName && e.status === 'completed' && e.output_data
    )
    return execution?.output_data ?? null
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
