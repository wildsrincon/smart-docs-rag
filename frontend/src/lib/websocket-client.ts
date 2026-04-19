import type {
  WSMessage,
  UserQueryMessage,
  AssistantResponseMessage,
  ErrorMessage,
  ErrorData,
  StatusMessage,
  DocumentStatusMessage,
  Citation,
} from '@/types/api'

export interface WebSocketClientOptions {
  onMessage?: (message: WSMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
  onOpen?: (event: Event) => void
  onAuthFailure?: () => void
  onAssistantResponse?: (token: string, done: boolean, citations?: Citation[]) => void
  onStatus?: (state: string, conversationId?: string) => void
  onDocumentStatus?: (documentId: string, status: string, progress: number) => void
  autoReconnect?: boolean
  reconnectInterval?: number
  getToken?: () => string | null
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private options: Omit<Required<WebSocketClientOptions>, 'getToken'> & { getToken: () => string | null }
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false
  private isDestroyed = false

  constructor(url: string, token: string, options: WebSocketClientOptions = {}) {
    this.url = url
    this.token = token
    this.options = {
      onMessage: options.onMessage || (() => {}),
      onError: options.onError || (() => {}),
      onClose: options.onClose || (() => {}),
      onOpen: options.onOpen || (() => {}),
      onAuthFailure: options.onAuthFailure || (() => {}),
      onAssistantResponse: options.onAssistantResponse || (() => {}),
      onStatus: options.onStatus || (() => {}),
      onDocumentStatus: options.onDocumentStatus || (() => {}),
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      getToken: options.getToken ?? (() => null),
    }
  }

  connect(): void {
    if (this.isDestroyed) return
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WS] Already connected or connecting')
      return
    }

    const freshToken = this.options.getToken()
    if (freshToken) {
      this.token = freshToken
      console.log('[WS] Using fresh token from getToken(), length:', freshToken.length)
    } else {
      console.log('[WS] No fresh token from getToken(), using original token, length:', this.token.length)
    }

    try {
      const tokenPayload = JSON.parse(atob(this.token.split('.')[1]))
      console.log('[WS] Token exp:', new Date(tokenPayload.exp * 1000).toISOString(), 'sub:', tokenPayload.sub)
      if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
        console.error('[WS] Token is EXPIRED — not connecting, triggering auth failure')
        this.options.onAuthFailure()
        return
      }
    } catch {
      console.error('[WS] Cannot decode token, attempting connection anyway')
    }

    this.isConnecting = true

    try {
      const wsUrl = `${this.url}?token=${this.token}`
      console.log('[WS] Connecting to:', this.url)
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = (event) => {
        console.log('WebSocket connected')
        this.isConnecting = false
        this.options.onOpen(event)
        this.clearReconnectTimeout()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          this.handleMessage(message)
          this.options.onMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (event) => {
        if (this.isDestroyed) return
        console.warn('[WS] Connection error (expected during StrictMode cleanup or reconnect)')
        this.isConnecting = false
        this.options.onError(event)
      }

      this.ws.onclose = (event) => {
        console.warn('[WS] Closed:', {
          code: event.code,
          reason: event.reason || '(no reason)',
          wasClean: event.wasClean,
        })
        this.isConnecting = false
        this.ws = null
        this.options.onClose(event)

        if (event.code === 1008) {
          console.error('[WS] Auth failure (1008) — stopping reconnect')
          this.options.onAuthFailure()
          return
        }

        if (this.options.autoReconnect && event.code !== 1000) {
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.isConnecting = false
    }
  }

  disconnect(): void {
    this.isDestroyed = true
    this.clearReconnectTimeout()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }

  sendUserQuery(text: string, documentId?: string, conversationId?: string, language?: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    const message: UserQueryMessage = {
      type: 'user_query',
      data: {
        text,
        document_id: documentId,
        conversation_id: conversationId,
        language,
      },
    }

    this.ws.send(JSON.stringify(message))
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'assistant_response':
        const { token, done, citations } = message.data as AssistantResponseMessage['data']
        this.options.onAssistantResponse(token, done, citations)
        break

      case 'status':
        const { state, conversation_id } = message.data as StatusMessage['data']
        this.options.onStatus(state, conversation_id)
        break

      case 'document_status':
        const { document_id, status, progress } = message.data as DocumentStatusMessage['data']
        this.options.onDocumentStatus(document_id, status, progress)
        break

      case 'error':
        const errorData = message.data as ErrorData
        if (!errorData || (!errorData.code && !errorData.message)) {
          console.error('WebSocket error: unknown error (empty data)')
        } else {
          console.error('WebSocket error message:', errorData)

          // Handle authentication failure
          if (errorData.code === 'AUTH_FAILED') {
            this.options.onAuthFailure()
          }
        }
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) return
    if (this.reconnectTimeout) {
      return
    }

    console.log(`Scheduling reconnect in ${this.options.reconnectInterval}ms`)
    this.reconnectTimeout = setTimeout(() => {
      if (this.isDestroyed) return
      console.log('Attempting to reconnect...')
      this.connect()
      this.reconnectTimeout = null
    }, this.options.reconnectInterval)
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export default WebSocketClient
