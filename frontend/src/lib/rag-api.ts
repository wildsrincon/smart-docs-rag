import axios from 'axios'

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
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const documentsApi = {
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0
        console.log(`Upload progress: ${progress}%`)
      },
    })
    return response.data
  },

  getAll: async (skip = 0, limit = 100) => {
    const response = await api.get('/documents', {
      params: { skip, limit },
    })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/documents/${id}`)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`)
    return response.data
  },

  getStatus: async (id: string) => {
    const response = await api.get(`/documents/${id}/status`)
    return response.data
  },
}

export const chatApi = {
  createConversation: async (title: string, token: string) => {
    const response = await api.post(
      '/chat/conversations',
      { title },
      {
        params: { token },
      }
    )
    return response.data
  },

  getAllConversations: async (skip = 0, limit = 100, token: string) => {
    const response = await api.get('/chat/conversations', {
      params: { skip, limit, token },
    })
    return response.data
  },

  getConversation: async (id: string, token: string) => {
    const response = await api.get(`/chat/conversations/${id}`, {
      params: { token },
    })
    return response.data
  },

  getConversationHistory: async (conversationId: string, token: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}/history`, {
      params: { token },
    })
    return response.data
  },

  deleteConversation: async (id: string, token: string) => {
    const response = await api.delete(`/chat/conversations/${id}`, {
      params: { token },
    })
    return response.status === 204
  },

  updateConversationTitle: async (
    id: string,
    title: string,
    token: string
  ) => {
    const response = await api.put(
      `/chat/conversations/${id}/title`,
      { title },
      { params: { token } }
    )
    return response.data
  },
}

export default api
