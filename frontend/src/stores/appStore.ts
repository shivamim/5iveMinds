import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  user: { id: string; email: string; name: string } | null
  setUser: (user: AppState['user']) => void
}

export const useStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  user: null,
  setUser: (user) => set({ user }),
}))
