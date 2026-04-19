import { create } from 'zustand'
import type { Conversation, Message, Citation } from '@/types/api'
import { chatApi } from '@/lib/rag-api'
import WebSocketClient from '@/lib/websocket-client'
import { detectLanguage } from '@/lib/language-detect'
import { useLanguageStore } from '@/store/language'
import { useAuthStore } from '@/store/auth'

const STOP_WORDS = new Set([
  'that', 'this', 'what', 'which', 'where', 'when', 'with', 'from', 'have',
  'does', 'will', 'would', 'could', 'should', 'about', 'into', 'they',
  'them', 'their', 'these', 'those', 'being', 'some', 'very', 'just',
  'also', 'than', 'then', 'each', 'every', 'other', 'more', 'most',
  'only', 'same', 'such', 'both', 'after', 'before', 'between', 'under',
  'again', 'there', 'here', 'over', 'can', 'the', 'and', 'for', 'not',
  'you', 'all', 'are', 'was', 'but', 'how', 'who', 'why', 'did', 'get',
  'has', 'had', 'his', 'her', 'its', 'may', 'our', 'she', 'too', 'use',
  'que', 'los', 'las', 'una', 'unos', 'unas', 'del', 'para', 'con',
  'por', 'entre', 'sobre', 'como', 'pero', 'más', 'este', 'esta', 'ese',
  'esa', 'aquel', 'aquella', 'todo', 'toda', 'todos', 'todas', 'algo',
  'algun', 'alguno', 'alguna', 'ningún', 'ninguno', 'ninguna', 'cada',
  'cuando', 'donde', 'puedo', 'puede', 'pueden', 'tengo', 'tiene',
])

function generateConversationTitle(text: string): string {
  if (!text || text.trim().length === 0) return 'New Conversation'

  const cleaned = text.trim().replace(/[?!.,;:]/g, '')
  const words = cleaned
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

  const unique = [...new Set(words)]

  if (unique.length === 0) return 'New Conversation'

  const title = unique.slice(0, 5).join(' ')
  return title.length > 50 ? title.slice(0, 47) + '...' : title
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Record<string, Message[]>
  currentResponse: string
  currentCitations: Citation[]
  isProcessing: boolean
  isConnected: boolean
  error: string | null

  // WebSocket client
  wsClient: WebSocketClient | null

  // Actions
  fetchConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<Conversation>
  selectConversation: (id: string | null) => Promise<void>
  sendMessage: (text: string, documentId?: string) => Promise<void>
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  updateCurrentResponse: (token: string, done: boolean, citations?: Citation[]) => void
  clearCurrentResponse: () => void
  clearError: () => void
  deleteConversation: (id: string) => Promise<void>
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: {},
  currentResponse: '',
  currentCitations: [],
  isProcessing: false,
  isConnected: false,
  error: null,
  wsClient: null,

  fetchConversations: async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token found')

      const conversations = await chatApi.getAllConversations(0, 100)
      set({ conversations })
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  },

  createConversation: async (title = 'New Conversation') => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token found')

      const conversation = await chatApi.createConversation(title)
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversationId: conversation.id,
        messages: { ...state.messages, [conversation.id]: [] },
      }))
      return conversation
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw error
    }
  },

  selectConversation: async (id: string | null) => {
    set({ currentConversationId: id, currentResponse: '' })

    if (!id) return

    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token found')

      const history = await chatApi.getConversationHistory(id)
      set((state) => ({
        messages: { ...state.messages, [id]: history.messages },
      }))
    } catch (error) {
      console.error('Failed to fetch conversation history:', error)
    }
  },

  sendMessage: async (text: string, documentId?: string) => {
    let { currentConversationId, wsClient } = get()

    if (!currentConversationId) {
      try {
        const conversation = await get().createConversation()
        currentConversationId = conversation.id
      } catch (error) {
        console.error('Failed to create conversation for message:', error)
        set({ error: 'Failed to create conversation' })
        return
      }
    }

    // Re-read wsClient after potential conversation creation
    wsClient = get().wsClient
    if (!wsClient || !wsClient.isConnected()) {
      set({ error: 'Not connected to chat server' })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: currentConversationId,
      user_id: '',
      role: 'user',
      content: text,
      tokens: null,
      document_ids: documentId ? JSON.stringify([documentId]) : null,
      citations: null,
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      messages: {
        ...state.messages,
        [currentConversationId!]: [...(state.messages[currentConversationId!] || []), userMessage],
      },
      isProcessing: true,
      currentResponse: '',
    }))

    const conversationMessages = get().messages[currentConversationId] || []
    const isFirstUserMessage = conversationMessages.filter((m) => m.role === 'user').length === 0

    if (isFirstUserMessage) {
      const title = generateConversationTitle(text)
      get().updateConversationTitle(currentConversationId, title)
    } else if (conversationMessages.filter((m) => m.role === 'user').length > 0 && conversationMessages.filter((m) => m.role === 'user').length % 5 === 4) {
      const allUserMessages = [...conversationMessages.filter((m) => m.role === 'user'), userMessage]
      const lastQuestions = allUserMessages.slice(-3).map((m) => m.content)
      const combined = lastQuestions.join(' ')
      const title = generateConversationTitle(combined)
      get().updateConversationTitle(currentConversationId, title)
    }

    const detectedLang = detectLanguage(text)
    useLanguageStore.getState().setDetectedLanguage(detectedLang)

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const safeDocumentId = documentId && UUID_REGEX.test(documentId) ? documentId : undefined
    wsClient.sendUserQuery(text, safeDocumentId, currentConversationId, detectedLang)
  },

  connectWebSocket: () => {
    const { wsClient: existingClient } = get()
    if (existingClient && existingClient.isConnected()) {
      console.log('[Chat] WebSocket already connected, skipping')
      return
    }

    // Read token directly from localStorage - the single source of truth
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.log('[Chat] No token in localStorage, skipping WebSocket')
      return
    }

    // Check expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expMs = (typeof payload.exp === 'string' ? parseInt(payload.exp, 10) : payload.exp) * 1000
      if (expMs < Date.now()) {
        console.error('[Chat] Token expired at', new Date(expMs).toISOString(), '- clearing and stopping')
        localStorage.removeItem('access_token')
        set({ error: 'Session expired. Please log in again.', isConnected: false })
        return
      }
    } catch {
      console.error('[Chat] Cannot decode token, skipping WebSocket')
      return
    }

    // Disconnect stale client if present
    if (existingClient) {
      existingClient.disconnect()
      set({ wsClient: null })
    }

    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsUrl = rawUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://') + '/api/v1/chat/ws'

    const client = new WebSocketClient(wsUrl, token, {
      onOpen: () => {
        console.log('[Chat] WebSocket connected')
        set({ isConnected: true, error: null })
      },
      onError: () => {
        console.warn('[Chat] WebSocket connection error — will retry if autoReconnect is enabled')
      },
      onClose: (event) => {
        const wasStale = event.code === 1000
        if (!wasStale) {
          console.warn('[Chat] WebSocket closed:', { code: event.code, reason: event.reason })
        }
        const { wsClient: currentClient } = get()
        if (currentClient === client) {
          set({ isConnected: false, isProcessing: false })
        }
      },
      onMessage: (message) => {
        if (message.type === 'error') {
          const data = message.data as { code?: string; message?: string }
          if (data?.code !== 'AUTH_FAILED') {
            set({ isProcessing: false, error: data?.message || 'An error occurred' })
          }
        }
      },
      onAuthFailure: () => {
        console.error('[Chat] WebSocket auth failed — clearing session')
        const { wsClient: currentClient } = get()
        if (currentClient) {
          currentClient.disconnect()
        }
        localStorage.removeItem('access_token')
        set({ isConnected: false, wsClient: null, error: 'Session expired. Please log in again.' })
      },
      onAssistantResponse: (token: string, done: boolean, citations?: Citation[]) => {
        get().updateCurrentResponse(token, done, citations)
      },
      onStatus: (state: string, conversationId?: string) => {
        if (state === 'processing') {
          set({ isProcessing: true })
        } else if (state === 'complete') {
          set({ isProcessing: false })
        } else if (state === 'connected') {
          set({ isConnected: true, error: null })
        }
      },
      getToken: () => localStorage.getItem('access_token'),
    })

    client.connect()
    set({ wsClient: client })
  },

  disconnectWebSocket: () => {
    const { wsClient } = get()
    if (wsClient) {
      wsClient.disconnect()
      set({ wsClient: null, isConnected: false })
    }
  },

  updateCurrentResponse: (token: string, done: boolean, citations?: Citation[]) => {
    const { currentConversationId, currentResponse, currentCitations } = get()

    if (!currentConversationId) return

    const newResponse = currentResponse + token
    const newCitations = citations || currentCitations

    set({ currentResponse: newResponse, currentCitations: newCitations })

    if (done) {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        conversation_id: currentConversationId,
        user_id: '',
        role: 'assistant',
        content: newResponse,
        tokens: null,
        document_ids: null,
        citations: newCitations.length > 0 ? newCitations : null,
        created_at: new Date().toISOString(),
      }

      set((state) => ({
        messages: {
          ...state.messages,
          [currentConversationId]: [
            ...(state.messages[currentConversationId] || []),
            assistantMessage,
          ],
        },
        currentResponse: '',
        currentCitations: [],
      }))
    }
  },

  clearCurrentResponse: () => {
    set({ currentResponse: '' })
  },

  clearError: () => {
    set({ error: null })
  },

  deleteConversation: async (id: string) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token found')

      await chatApi.deleteConversation(id)
      set((state) => {
        const newMessages = { ...state.messages }
        delete newMessages[id]
        return {
          conversations: state.conversations.filter((c) => c.id !== id),
          messages: newMessages,
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId,
          error: null,
        }
      })
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      set({ error: 'Failed to delete conversation' })
      throw error
    }
  },

  updateConversationTitle: async (conversationId: string, title: string) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const updated = await chatApi.updateConversationTitle(conversationId, title)
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, title: updated.title } : c
        ),
      }))
    } catch (error) {
      console.error('Failed to update conversation title:', error)
    }
  },

}))
