import { create } from 'zustand'
import type { Conversation, Message, Citation } from '@/types/api'
import { chatApi } from '@/lib/rag-api'
import WebSocketClient from '@/lib/websocket-client'

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

      const conversations = await chatApi.getAllConversations(0, 100, token)
      set({ conversations })
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  },

  createConversation: async (title = 'New Conversation') => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token found')

      const conversation = await chatApi.createConversation(title, token)
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

      const history = await chatApi.getConversationHistory(id, token)
      set((state) => ({
        messages: { ...state.messages, [id]: history.messages },
      }))
    } catch (error) {
      console.error('Failed to fetch conversation history:', error)
    }
  },

  sendMessage: async (text: string, documentId?: string) => {
    const { currentConversationId, wsClient } = get()

    if (!currentConversationId) {
      // Create new conversation if none exists
      await get().createConversation()
      return get().sendMessage(text, documentId)
    }

    if (!wsClient || !wsClient.isConnected()) {
      set({ error: 'Not connected to chat server' })
      return
    }

    // Add user message to local state
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
        [currentConversationId]: [...(state.messages[currentConversationId] || []), userMessage],
      },
      isProcessing: true,
      currentResponse: '',
    }))

    // Send message via WebSocket
    wsClient.sendUserQuery(text, documentId, currentConversationId)
  },

  connectWebSocket: () => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const wsUrl = process.env.NEXT_PUBLIC_API_URL
      ? `ws://${process.env.NEXT_PUBLIC_API_URL.replace('http://', '').replace('https://', '')}/api/v1/chat/ws`
      : 'ws://localhost:8000/api/v1/chat/ws'

    const client = new WebSocketClient(wsUrl, token, {
      onOpen: () => {
        console.log('Chat WebSocket connected')
        set({ isConnected: true, error: null })
      },
      onError: (error) => {
        console.error('Chat WebSocket error:', error)
        set({ error: 'Connection error' })
      },
      onClose: () => {
        console.log('Chat WebSocket disconnected')
        set({ isConnected: false })
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

      await chatApi.deleteConversation(id, token)
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
}))
