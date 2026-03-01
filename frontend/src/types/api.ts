// API Types from backend

export const PRIORITY = {
  NORMAL: 'Normal',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  TOP: 'Top',
} as const

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY]

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
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
