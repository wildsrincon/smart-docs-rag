'use client'
import { FileText, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Document {
  id: string
  title: string
  type: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress?: number
  error?: string
}

interface DocumentCardProps {
  document: Document
  onSelect: (document: Document) => void
  onDelete: (document: Document) => void
}

export default function DocumentCard({ document, onSelect, onDelete }: DocumentCardProps) {
  const getStatusIcon = () => {
    switch (document.status) {
      case 'uploading':
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (document.status) {
      case 'uploading':
      case 'processing':
        return 'border-orange-500'
      case 'ready':
        return 'border-green-500'
      case 'error':
        return 'border-red-500'
      default:
        return 'border-slate-300 dark:border-slate-600'
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={() => onDelete(document)}
        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
      >
        <X className="w-3 h-3" />
      </button>
      <div
        onClick={() => onSelect(document)}
        className={`p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 cursor-pointer ${getStatusColor()}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-white truncate text-sm mb-1">
              {document.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="capitalize">{document.type}</span>
              <span>•</span>
              {getStatusIcon()}
              <span className="capitalize">{document.status}</span>
            </div>
            {(document.status === 'uploading' || document.status === 'processing') && document.progress !== undefined && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${document.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{document.progress}%</p>
              </div>
            )}
            {document.status === 'error' && document.error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{document.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
