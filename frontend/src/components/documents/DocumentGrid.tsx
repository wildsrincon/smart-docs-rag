'use client'

import type { Document } from '@/types/api'
import DocumentCard from './DocumentCard'
import { FileText } from 'lucide-react'

interface DocumentGridProps {
  documents: Document[]
  onSelectForChat: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (document: Document) => void
  onDownload?: (document: Document) => void
  loading?: boolean
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full mt-2" />
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  )
}

export default function DocumentGrid({ documents, onSelectForChat, onDelete, onPreview, onDownload, loading }: DocumentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onSelectForChat={onSelectForChat}
          onDelete={onDelete}
          onPreview={onPreview}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}
