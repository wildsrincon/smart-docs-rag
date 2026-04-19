import axios, { AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isGoogleCallback = error.config?.url?.includes('/auth/google/callback')
      const isOnCallbackPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')

      if (isGoogleCallback || isOnCallbackPage) {
        console.warn('[API] 401 on auth callback page — not redirecting')
        return Promise.reject(error)
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  googleLogin: async () => {
    const response = await api.get('/auth/google/login')
    return response.data
  },

  googleCallback: async (code: string, state: string) => {
    const response = await api.get('/auth/google/callback', {
      params: { code, state },
    })
    return response.data
  },

  unlinkGoogle: async () => {
    const response = await api.delete('/auth/google/unlink')
    return response.data
  },

  verifyToken: async (token: string) => {
    const response = await api.get('/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout', {})
    return response.data
  },
}

export const usersApi = {
  getMe: async () => {
    const response = await api.get('/users/me')
    return response.data
  },

  changePassword: async (data: { current_password: string; new_password: string; new_password_confirm: string }) => {
    const response = await api.put('/users/change-password', data)
    return response.data
  },
}

export const todosApi = {
  getStats: async () => {
    const response = await api.get('/todos/stats')
    return response.data
  },

  getAll: async () => {
    const response = await api.get('/todos')
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/todos/${id}`)
    return response.data
  },

  create: async (data: { description: string; due_date: string | null; priority: string }) => {
    const response = await api.post('/todos', data)
    return response.data
  },

  update: async (id: string, data: { description: string; due_date: string | null; priority: string }) => {
    const response = await api.put(`/todos/${id}`, data)
    return response.data
  },

  complete: async (id: string) => {
    const response = await api.put(`/todos/${id}/complete`)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/todos/${id}`)
    return response.data
  },
}

export default api
