import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Todo } from '@/types/api'
import { todosApi } from '@/lib/api'

interface TodosState {
  todos: Todo[]
  isLoading: boolean
  error: string | null

  fetchTodos: () => Promise<void>
  createTodo: (data: { description: string; due_date: string | null; priority: string }) => Promise<void>
  updateTodo: (id: string, data: { description: string; due_date: string | null; priority: string }) => Promise<void>
  completeTodo: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  clearError: () => void
}

export const useTodosStore = create<TodosState>()(
  immer((set) => ({
    todos: [],
    isLoading: false,
    error: null,

    fetchTodos: async () => {
      set({ isLoading: true, error: null })
      try {
        const todos = await todosApi.getAll()
        set({ todos, isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch todos',
          isLoading: false,
        })
      }
    },

    createTodo: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const newTodo = await todosApi.create(data)
        set((state) => {
          state.todos.push(newTodo)
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create todo',
          isLoading: false,
        })
        throw error // Re-throw so caller can handle it
      }
    },

    updateTodo: async (id, data) => {
      set({ isLoading: true, error: null })
      try {
        const updatedTodo = await todosApi.update(id, data)
        set((state) => {
          const index = state.todos.findIndex((t) => t.id === id)
          if (index !== -1) {
            state.todos[index] = updatedTodo
          }
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update todo',
          isLoading: false,
        })
      }
    },

    completeTodo: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const updatedTodo = await todosApi.complete(id)
        set((state) => {
          const index = state.todos.findIndex((t) => t.id === id)
          if (index !== -1) {
            state.todos[index] = updatedTodo
          }
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to complete todo',
          isLoading: false,
        })
      }
    },

    deleteTodo: async (id) => {
      set({ isLoading: true, error: null })
      try {
        await todosApi.delete(id)
        set((state) => {
          state.todos = state.todos.filter((t) => t.id !== id)
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete todo',
          isLoading: false,
        })
      }
    },

    clearError: () => set({ error: null }),
  }))
)
