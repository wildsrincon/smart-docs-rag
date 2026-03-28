import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, ProviderType, GoogleLoginUrlResponse } from '@/types/api'
import { authApi, usersApi } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isRestoring: boolean

  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  restoreSession: () => Promise<void>
  clearError: () => void
}

const setTokenCookie = (token: string) => {
  if (typeof document !== 'undefined') {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    document.cookie = `access_token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
  }
}

const removeTokenCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie =
      'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isRestoring: true,

      restoreSession: async () => {
        try {
          const token = localStorage.getItem('access_token')
          if (token) {
            const result = await authApi.verifyToken(token)
            if (result.valid) {
              set({ isAuthenticated: true, token })
              await get().fetchUser()
            } else {
              throw new Error('Invalid token')
            }
          }
        } catch (error) {
          localStorage.removeItem('access_token')
          removeTokenCookie()
          set({ user: null, token: null, isAuthenticated: false })
        } finally {
          set({ isRestoring: false })
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.login(email, password)
          localStorage.setItem('access_token', data.access_token)
          setTokenCookie(data.access_token)
          set({
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          await get().fetchUser()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            token: null,
          })
          throw error
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
          const { authorization_url } = await authApi.googleLogin()
          // Redirect to Google OAuth page
          if (typeof window !== 'undefined') {
            window.location.href = authorization_url
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Google login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (data: {
        email: string
        password: string
        first_name: string
        last_name: string
      }) => {
        set({ isLoading: true, error: null })
        try {
          await authApi.register(data)
          set({ isLoading: false })
          await get().login(data.email, data.password)
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authApi.logout()
        } catch (error) {
          console.warn('Logout failed on server, clearing client state:', error)
        } finally {
          localStorage.removeItem('access_token')
          removeTokenCookie()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      fetchUser: async () => {
        try {
          const user = await usersApi.getMe()
          set({ user })
        } catch (error) {
          set({ user: null, isAuthenticated: false, token: null })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
