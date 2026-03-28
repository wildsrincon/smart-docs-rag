'use client'

import type { Document } from '@/types/api'
import { cn } from '@/lib/utils'
import { getFileConfig, formatFileSize, formatDate, getStatusConfig } from '@/lib/document-utils'
import { X, MessageSquare, Trash2 } from 'lucide-react'

interface DocumentPreviewProps {
  document: Document | null
  open: boolean
  onClose: () => void
  onChat: (documentId: string) => void
  onDelete: (documentId: string) => void
}

export default function DocumentPreview({ document, open, onClose, onChat, onDelete }: DocumentPreviewProps) {
  if (!open || !document) return null

  const fileConfig = getFileConfig(document.filename)
  const statusConfig = getStatusConfig(document.status)
  const FileIcon = fileConfig.icon

  const progress = document.total_chunks > 0
    ? Math.round((document.processed_chunks / document.total_chunks) * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700',
        'w-full max-w-xl overflow-hidden',
        'animate-in fade-in zoom-in-95 duration-200'
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate pr-4">
            Document Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className={cn(
              'flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br',
              fileConfig.bgLight, fileConfig.bgDark
            )}>
              <FileIcon className={cn('w-10 h-10', fileConfig.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white break-words" title={document.filename}>
                {document.filename}
              </h3>
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mt-2',
                statusConfig.bgLight, statusConfig.bgDark, statusConfig.color
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <InfoItem label="Size" value={formatFileSize(document.file_size)} />
            <InfoItem label="Uploaded" value={formatDate(document.created_at)} />
            <InfoItem label="Chunks" value={document.total_chunks > 0 ? `${document.processed_chunks}/${document.total_chunks}` : 'N/A'} />
            <InfoItem label="Type" value={fileConfig.label} />

            {document.processed_at && (
              <InfoItem label="Processed" value={formatDate(document.processed_at)} />
            )}

            {document.error_message && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Error</p>
                <p className="text-sm text-red-500 dark:text-red-400 break-words">{document.error_message}</p>
              </div>
            )}
          </div>

          {(document.status === 'processing' || document.status === 'pending') && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Processing progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => { onChat(document.id) }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Chat with this document
          </button>
          <button
            onClick={() => { onDelete(document.id); onClose() }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
