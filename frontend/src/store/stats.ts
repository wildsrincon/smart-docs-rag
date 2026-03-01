import { create } from 'zustand'
import type { TodoStats } from '@/types/api'
import { todosApi } from '@/lib/api'

interface StatsState {
  stats: TodoStats | null
  isLoading: boolean
  error: string | null

  fetchStats: () => Promise<void>
  clearError: () => void
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null })
    try {
      const stats = await todosApi.getStats()
      set({ stats, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
