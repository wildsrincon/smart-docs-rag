'use client'

import type { Document } from '@/types/api'
import { cn } from '@/lib/utils'
import { getFileConfig, formatFileSize, formatDate, getStatusConfig } from '@/lib/document-utils'
import { MessageSquare, Trash2, Eye } from 'lucide-react'
import { useState, useCallback } from 'react'

interface DocumentCardProps {
  document: Document
  onSelectForChat: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (document: Document) => void
  onDownload?: (document: Document) => void
}

export default function DocumentCard({ document, onSelectForChat, onDelete, onPreview }: DocumentCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileConfig = getFileConfig(document.filename)
  const statusConfig = getStatusConfig(document.status)
  const FileIcon = fileConfig.icon

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (deleting) return
    const confirmed = window.confirm('Are you sure you want to delete this document?')
    if (!confirmed) return
    setDeleting(true)
    onDelete(document.id)
  }, [deleting, onDelete, document.id])

  const progress = document.total_chunks > 0
    ? Math.round((document.processed_chunks / document.total_chunks) * 100)
    : 0

  return (
    <div
      className={cn(
        'group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700',
        'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:-translate-y-1',
        'transition-all duration-300 cursor-pointer overflow-hidden'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex-1 p-5">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
            fileConfig.bgLight, fileConfig.bgDark
          )}>
            <FileIcon className={cn('w-6 h-6', fileConfig.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate pr-1" title={document.filename}>
              {document.filename}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                statusConfig.bgLight, statusConfig.bgDark, statusConfig.color
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                {statusConfig.label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {formatFileSize(document.file_size)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{formatDate(document.created_at)}</span>
          {document.total_chunks > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              {document.processed_chunks}/{document.total_chunks} chunks
            </span>
          )}
        </div>

        {document.status === 'pending' && (
          <div className="mt-3">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                </span>
                Waiting to process
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {document.status === 'processing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Processing
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              {progress > 0 ? (
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        )}

        {document.error_message && (
          <p className="mt-3 text-xs text-red-500 dark:text-red-400 truncate" title={document.error_message}>
            {document.error_message}
          </p>
        )}
      </div>

      <div className={cn(
        'flex items-center justify-end gap-1 px-4 py-2.5 border-t transition-all duration-200',
        showActions
          ? 'border-slate-200 dark:border-slate-700 opacity-100'
          : 'border-transparent opacity-0 max-h-0 py-0 overflow-hidden'
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(document) }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelectForChat(document.id) }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
          title="Chat"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  )
}
