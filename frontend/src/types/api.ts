// API Types from backend

export const PRIORITY = {
  NORMAL: 'Normal',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  TOP: 'Top',
} as const

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY]

export const INGESTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type IngestionStatus = (typeof INGESTION_STATUS)[keyof typeof INGESTION_STATUS]

export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE]

export type ProviderType = 'manual' | 'google'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  google_id?: string
  provider?: ProviderType
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface Todo {
  id: string
  description: string
  due_date: string | null
  priority: Priority
  is_completed: boolean
  completed_at: string | null
}

export interface TodoStats {
  total: number
  completed: number
  pending: number
  by_priority: Record<string, number>
  completed_this_week: number
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface LoginRequest {
  username: string // OAuth2 uses username field for email
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  provider: ProviderType
}

export interface TodoCreate {
  description: string
  due_date: string | null
  priority: Priority
}

export interface PasswordChange {
  current_password: string
  new_password: string
  new_password_confirm: string
}

// OAuth Types

export interface GoogleLoginUrlResponse {
  authorization_url: string
  state: string
}

// RAG Types

export interface Document {
  id: string
  user_id: string
  filename: string
  file_size: number
  status: IngestionStatus
  total_chunks: number
  processed_chunks: number
  error_message: string | null
  metadata: string | null
  created_at: string
  processed_at: string | null
}

export interface DocumentStatus {
  document_id: string
  status: IngestionStatus
  progress: number
  total_chunks: number
  processed_chunks: number
  error_message: string | null
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: MessageRole
  content: string
  tokens: number | null
  document_ids: string | null
  citations: Citation[] | null
  created_at: string
}

export interface Citation {
  index: number
  document_id: string
  document_name: string
  chunk_index: number
  page?: number | string | null
}

export interface ChatHistory {
  conversation_id: string
  messages: Message[]
}

// WebSocket Message Types

export type WSMessageType = 'user_query' | 'assistant_response' | 'error' | 'status' | 'document_status'

export interface BaseWSMessage {
  type: WSMessageType
  data: unknown
}

export interface UserQueryData {
  text: string
  document_id?: string
  conversation_id?: string
}

export interface UserQueryMessage extends BaseWSMessage {
  type: 'user_query'
  data: UserQueryData
}

export interface AssistantResponseData {
  token: string
  done: boolean
  citations?: Citation[]
}

export interface AssistantResponseMessage extends BaseWSMessage {
  type: 'assistant_response'
  data: AssistantResponseData
}

export interface ErrorData {
  code: string
  message: string
}

export interface ErrorMessage extends BaseWSMessage {
  type: 'error'
  data: ErrorData
}

export interface StatusData {
  state: string
  conversation_id?: string
}

export interface StatusMessage extends BaseWSMessage {
  type: 'status'
  data: StatusData
}

export interface DocumentStatusData {
  document_id: string
  status: IngestionStatus
  progress: number
}

export interface DocumentStatusMessage extends BaseWSMessage {
  type: 'document_status'
  data: DocumentStatusData
}

export type WSMessage = UserQueryMessage | AssistantResponseMessage | ErrorMessage | StatusMessage | DocumentStatusMessage
