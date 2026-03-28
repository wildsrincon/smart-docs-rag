import type {
  WSMessage,
  UserQueryMessage,
  AssistantResponseMessage,
  ErrorMessage,
  StatusMessage,
  DocumentStatusMessage,
  Citation,
} from '@/types/api'

export interface WebSocketClientOptions {
  onMessage?: (message: WSMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
  onOpen?: (event: Event) => void
  onAssistantResponse?: (token: string, done: boolean, citations?: Citation[]) => void
  onStatus?: (state: string, conversationId?: string) => void
  onDocumentStatus?: (documentId: string, status: string, progress: number) => void
  autoReconnect?: boolean
  reconnectInterval?: number
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private options: Required<WebSocketClientOptions>
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false

  constructor(url: string, token: string, options: WebSocketClientOptions = {}) {
    this.url = url
    this.token = token
    this.options = {
      onMessage: options.onMessage || (() => {}),
      onError: options.onError || (() => {}),
      onClose: options.onClose || (() => {}),
      onOpen: options.onOpen || (() => {}),
      onAssistantResponse: options.onAssistantResponse || (() => {}),
      onStatus: options.onStatus || (() => {}),
      onDocumentStatus: options.onDocumentStatus || (() => {}),
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
    }
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting')
      return
    }

    this.isConnecting = true

    try {
      const wsUrl = `${this.url}?token=${this.token}`
      console.log('Connecting to WebSocket:', wsUrl)
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
        console.error('WebSocket error:', event)
        this.isConnecting = false
        this.options.onError(event)
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        this.isConnecting = false
        this.options.onClose(event)

        // Attempt to reconnect if enabled
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
    this.clearReconnectTimeout()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }

  sendUserQuery(text: string, documentId?: string, conversationId?: string): void {
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
        console.error('WebSocket error message:', message.data)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return
    }

    console.log(`Scheduling reconnect in ${this.options.reconnectInterval}ms`)
    this.reconnectTimeout = setTimeout(() => {
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
