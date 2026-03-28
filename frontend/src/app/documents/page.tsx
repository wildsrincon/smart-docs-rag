'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useDocumentStore } from '@/store/documents'
import UploadSection from '@/components/documents/UploadSection'
import TipsSection from '@/components/documents/TipsSection'

export default function DocumentsPage() {
  const { documents, fetchDocuments, loading, selectDocument, deleteDocument } = useDocumentStore()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const stats = {
    total: documents.length,
    processed: documents.filter(d => d.status === 'completed').length,
    failed: documents.filter(d => d.status === 'failed').length,
  }

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId)
    }
  }

  const handleSelectForChat = (documentId: string) => {
    selectDocument(documentId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Documents</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Documents
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Upload and manage your PDF documents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <span className="text-slate-600 dark:text-slate-400">📄</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Processed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.processed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400">✗</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <UploadSection />
            <TipsSection />
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
              Your Documents ({documents.length})
            </h3>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No documents yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Upload PDFs to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                          <span className="text-white text-lg">📄</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              doc.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : doc.status === 'processing'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {doc.status}
                            </span>

                            {doc.total_chunks > 0 && (
                              <span className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {doc.processed_chunks}/{doc.total_chunks} chunks
                              </span>
                            )}

                            {doc.file_size > 0 && (
                              <span className="text-xs text-slate-500 dark:text-slate-500">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectForChat(doc.id)}
                          className="flex-shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/20 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Select for chat"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
