'use client'

import type { Document } from '@/types/api'
import { cn } from '@/lib/utils'
import { getFileConfig, formatFileSize, formatDate, getStatusConfig } from '@/lib/document-utils'
import { MessageSquare, Trash2, Eye } from 'lucide-react'
import { useState } from 'react'

interface DocumentCardProps {
  document: Document
  onSelectForChat: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (document: Document) => void
  onDownload?: (document: Document) => void
}

export default function DocumentCard({ document, onSelectForChat, onDelete, onPreview }: DocumentCardProps) {
  const [showActions, setShowActions] = useState(false)
  const fileConfig = getFileConfig(document.filename)
  const statusConfig = getStatusConfig(document.status)
  const FileIcon = fileConfig.icon

  const progress = document.total_chunks > 0
    ? Math.round((document.processed_chunks / document.total_chunks) * 100)
    : 0

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700',
        'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:-translate-y-1',
        'transition-all duration-300 cursor-pointer overflow-hidden'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
            fileConfig.bgLight, fileConfig.bgDark
          )}>
            <FileIcon className={cn('w-7 h-7', fileConfig.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={document.filename}>
              {document.filename}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                statusConfig.bgLight, statusConfig.bgDark, statusConfig.color
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            {formatFileSize(document.file_size)}
          </span>
          <span>{formatDate(document.created_at)}</span>
          {document.total_chunks > 0 && (
            <span>{document.processed_chunks}/{document.total_chunks} chunks</span>
          )}
        </div>

        {(document.status === 'processing' || document.status === 'pending') && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Processing</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
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
        'absolute top-3 right-3 flex items-center gap-1 transition-all duration-200',
        showActions ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(document) }}
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-700/90 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 shadow-sm transition-colors"
          title="Preview"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelectForChat(document.id) }}
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-700/90 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm transition-colors"
          title="Chat with document"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(document.id) }}
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-700/90 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-500 shadow-sm transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
