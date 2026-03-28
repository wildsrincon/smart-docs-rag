'use client'

import { FileText, Trash2, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react'
import { useDocumentStore } from '@/store/documents'
import type { Document, IngestionStatus } from '@/types/api'

interface DocumentPickerProps {
  onDocumentSelect?: (documentId: string) => void
}

export default function DocumentPicker({ onDocumentSelect }: DocumentPickerProps) {
  const { documents, selectedDocumentId, selectDocument, deleteDocument, ingestionStatuses } = useDocumentStore()

  const getStatusIcon = (status: IngestionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusProgress = (documentId: string) => {
    const status = ingestionStatuses[documentId]
    if (!status) return null

    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>Processing...</span>
          <span className="font-medium">{status.progress}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>
    )
  }

  const handleDelete = async (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
        Documents
      </h3>

      {documents.length === 0 ? (
        <div className="text-center py-8 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No documents yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Upload PDFs to get started</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {documents.map((document: Document) => (
            <div
              key={document.id}
              onClick={() => {
                selectDocument(document.id === selectedDocumentId ? null : document.id)
                onDocumentSelect?.(document.id)
              }}
              className={`
                p-4 rounded-xl border cursor-pointer transition-all duration-300
                ${selectedDocumentId === document.id 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    selectedDocumentId === document.id
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    <FileText className={`w-4 h-4 ${
                      selectedDocumentId === document.id ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                      {document.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusIcon(document.status)}
                      <span className="text-xs font-medium capitalize text-slate-600 dark:text-slate-400">
                        {document.status}
                      </span>
                      {document.total_chunks > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {document.processed_chunks}/{document.total_chunks} chunks
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, document.id)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {(document.status === 'processing' || document.status === 'pending') && getStatusProgress(document.id)}

              {document.error_message && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">{document.error_message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
