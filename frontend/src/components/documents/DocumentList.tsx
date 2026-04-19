'use client'

import type { Document } from '@/types/api'
import { cn } from '@/lib/utils'
import { getFileConfig, formatFileSize, formatDate, getStatusConfig } from '@/lib/document-utils'
import { MessageSquare, Eye, Trash2, FileText } from 'lucide-react'

interface DocumentListProps {
  documents: Document[]
  onSelectForChat: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (document: Document) => void
  onDownload?: (document: Document) => void
  loading?: boolean
  sortField?: 'name' | 'date' | 'size' | 'status'
  sortDir?: 'asc' | 'desc'
  onSort?: (field: 'name' | 'date' | 'size' | 'status') => void
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
      </div>
      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded hidden sm:block" />
      <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full hidden md:block" />
      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded hidden lg:block" />
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

const SortIcon = ({ field, sortField, sortDir }: { field: string; sortField?: string; sortDir?: 'asc' | 'desc' }) => {
  if (field !== sortField) return <span className="text-slate-300 dark:text-slate-600 ml-1">&#8693;</span>
  return <span className="text-primary-500 ml-1">{sortDir === 'asc' ? '&#8593;' : '&#8595;'}</span>
}

export default function DocumentList({ documents, onSelectForChat, onDelete, onPreview, loading, sortField, sortDir, onSort }: DocumentListProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
          <FileText className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No documents found</p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Upload files or adjust your filters
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="hidden md:grid grid-cols-[1fr_100px_110px_80px_44px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        <button onClick={() => onSort?.('name')} className="text-left hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
        </button>
        <button onClick={() => onSort?.('date')} className="text-left hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          Date <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
        </button>
        <button onClick={() => onSort?.('size')} className="text-left hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          Size <SortIcon field="size" sortField={sortField} sortDir={sortDir} />
        </button>
        <button onClick={() => onSort?.('status')} className="text-left hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
        </button>
        <div />
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {documents.map((doc) => {
          const fileConfig = getFileConfig(doc.filename)
          const statusConfig = getStatusConfig(doc.status)
          const FileIcon = fileConfig.icon

          return (
            <div
              key={doc.id}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5',
                'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                fileConfig.bgLight, fileConfig.bgDark
              )}>
                <FileIcon className={cn('w-5 h-5', fileConfig.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={doc.filename}>
                  {doc.filename}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:hidden">
                  {formatFileSize(doc.file_size)} &middot; {formatDate(doc.created_at)}
                </p>
              </div>

              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block w-[100px]">
                {formatDate(doc.created_at)}
              </span>

              <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:block w-[110px]">
                {formatFileSize(doc.file_size)}
              </span>

              <span className={cn(
                'hidden md:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit',
                statusConfig.bgLight, statusConfig.bgDark, statusConfig.color
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                {statusConfig.label}
              </span>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onPreview(doc)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectForChat(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  title="Chat with document"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
