import {
  FileText,
  FileSpreadsheet,
  File,
  FileCode,
  Presentation,
  FileImage,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'md' | 'png' | 'jpg' | 'jpeg' | 'gif'

export interface FileTypeConfig {
  label: string
  color: string
  bgLight: string
  bgDark: string
  icon: LucideIcon
}

export const FILE_TYPE_CONFIG: Record<FileType, FileTypeConfig> = {
  pdf: {
    label: 'PDF',
    color: 'text-red-500',
    bgLight: 'bg-red-100',
    bgDark: 'dark:bg-red-900/30',
    icon: FileText,
  },
  docx: {
    label: 'DOCX',
    color: 'text-blue-500',
    bgLight: 'bg-blue-100',
    bgDark: 'dark:bg-blue-900/30',
    icon: FileText,
  },
  xlsx: {
    label: 'XLSX',
    color: 'text-green-500',
    bgLight: 'bg-green-100',
    bgDark: 'dark:bg-green-900/30',
    icon: FileSpreadsheet,
  },
  pptx: {
    label: 'PPTX',
    color: 'text-orange-500',
    bgLight: 'bg-orange-100',
    bgDark: 'dark:bg-orange-900/30',
    icon: Presentation,
  },
  txt: {
    label: 'TXT',
    color: 'text-slate-500',
    bgLight: 'bg-slate-100',
    bgDark: 'dark:bg-slate-700',
    icon: File,
  },
  md: {
    label: 'MD',
    color: 'text-purple-500',
    bgLight: 'bg-purple-100',
    bgDark: 'dark:bg-purple-900/30',
    icon: FileCode,
  },
  png: {
    label: 'PNG',
    color: 'text-pink-500',
    bgLight: 'bg-pink-100',
    bgDark: 'dark:bg-pink-900/30',
    icon: FileImage,
  },
  jpg: {
    label: 'JPG',
    color: 'text-pink-500',
    bgLight: 'bg-pink-100',
    bgDark: 'dark:bg-pink-900/30',
    icon: FileImage,
  },
  jpeg: {
    label: 'JPEG',
    color: 'text-pink-500',
    bgLight: 'bg-pink-100',
    bgDark: 'dark:bg-pink-900/30',
    icon: FileImage,
  },
  gif: {
    label: 'GIF',
    color: 'text-pink-500',
    bgLight: 'bg-pink-100',
    bgDark: 'dark:bg-pink-900/30',
    icon: FileImage,
  },
}

const ACCEPTED_EXTENSIONS = Object.keys(FILE_TYPE_CONFIG) as FileType[]

export function getFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() as FileType
  if (ext && FILE_TYPE_CONFIG[ext]) return ext
  return 'txt'
}

export function getFileConfig(filename: string): FileTypeConfig {
  return FILE_TYPE_CONFIG[getFileType(filename)]
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export const ACCEPTED_FILE_TYPES = ACCEPTED_EXTENSIONS.map(ext => `.${ext}`).join(',')
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/gif',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024

export type DocumentStatus = 'processed' | 'pending' | 'failed' | 'processing'

export interface StatusConfig {
  label: string
  color: string
  bgLight: string
  bgDark: string
  dotColor: string
}

export const STATUS_CONFIG: Record<DocumentStatus, StatusConfig> = {
  processed: {
    label: 'Processed',
    color: 'text-green-700 dark:text-green-400',
    bgLight: 'bg-green-100',
    bgDark: 'dark:bg-green-900/20',
    dotColor: 'bg-green-500',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgLight: 'bg-yellow-100',
    bgDark: 'dark:bg-yellow-900/20',
    dotColor: 'bg-yellow-500',
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700 dark:text-blue-400',
    bgLight: 'bg-blue-100',
    bgDark: 'dark:bg-blue-900/20',
    dotColor: 'bg-blue-500',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-700 dark:text-red-400',
    bgLight: 'bg-red-100',
    bgDark: 'dark:bg-red-900/20',
    dotColor: 'bg-red-500',
  },
}

export function getStatusConfig(status: string): StatusConfig {
  const mapped = status === 'completed' ? 'processed' : status
  return STATUS_CONFIG[mapped as DocumentStatus] || STATUS_CONFIG.pending
}
