'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useDocumentStore } from '@/store/documents'
import { cn } from '@/lib/utils'
import { getFileType, type FileType, type DocumentStatus } from '@/lib/document-utils'
import DocumentGrid from '@/components/documents/DocumentGrid'
import DocumentList from '@/components/documents/DocumentList'
import DocumentViewToggle, { useViewMode } from '@/components/documents/DocumentViewToggle'
import UploadModal from '@/components/documents/UploadModal'
import DocumentFilters from '@/components/documents/DocumentFilters'
import DocumentPreview from '@/components/documents/DocumentPreview'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Document } from '@/types/api'
import { useRouter } from 'next/navigation'

const ITEMS_PER_PAGE = 12

type SortField = 'name' | 'date' | 'size' | 'status'
type SortDir = 'asc' | 'desc'

export default function DocumentsPage() {
  const router = useRouter()
  const {
    documents: storeDocuments,
    fetchDocuments,
    loading,
    selectDocument,
    deleteDocument,
    uploadDocument,
  } = useDocumentStore()

  const { viewMode, onViewModeChange } = useViewMode()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState<FileType | 'all'>('all')
  const [status, setStatus] = useState<DocumentStatus | 'all'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const documents = storeDocuments

  const stats = {
    total: documents.length,
    processed: documents.filter(d => d.status === 'completed').length,
    pending: documents.filter(d => d.status === 'pending' || d.status === 'processing').length,
    failed: documents.filter(d => d.status === 'failed').length,
  }

  const filtered = useMemo(() => {
    let result = [...documents]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d => d.filename.toLowerCase().includes(q))
    }

    if (fileType !== 'all') {
      result = result.filter(d => getFileType(d.filename) === fileType)
    }

    if (status !== 'all') {
      const statusMap: Record<DocumentStatus, string[]> = {
        processed: ['completed'],
        pending: ['pending'],
        processing: ['processing'],
        failed: ['failed'],
      }
      const allowed = statusMap[status] || []
      result = result.filter(d => allowed.includes(d.status))
    }

    if (dateRange !== 'all') {
      const now = Date.now()
      const ms = dateRange === 'today' ? 86400000 : dateRange === 'week' ? 7 * 86400000 : 30 * 86400000
      result = result.filter(d => now - new Date(d.created_at).getTime() < ms)
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': cmp = a.filename.localeCompare(b.filename); break
        case 'date': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break
        case 'size': cmp = a.file_size - b.file_size; break
        case 'status': cmp = a.status.localeCompare(b.status); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [documents, search, fileType, status, dateRange, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleSort = useCallback((field: SortField) => {
    setSortDir(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc')
    setSortField(field)
    setPage(1)
  }, [sortField])

  useEffect(() => {
    setPage(1)
  }, [search, fileType, status, dateRange])

  const handleDelete = useCallback(async (documentId: string): Promise<boolean> => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return false
    }
    try {
      await deleteDocument(documentId)
      return true
    } catch {
      return false
    }
  }, [deleteDocument])

  const handleSelectForChat = useCallback((documentId: string) => {
    selectDocument(documentId)
    router.push('/chat')
  }, [selectDocument, router])

  const handleUpload = useCallback(async (files: File[]) => {
    for (const file of files) {
      await uploadDocument(file)
    }
    setUploadModalOpen(false)
  }, [uploadDocument])

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
              Documents
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload and manage your knowledge base
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Upload Documents
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
            label="Total"
            value={stats.total}
            iconBg="bg-slate-100 dark:bg-slate-700"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
            label="Processed"
            value={stats.processed}
            valueColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-100 dark:bg-green-900/20"
          />
          <StatCard
            icon={<div className="w-5 h-5 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />}
            label="Processing"
            value={stats.pending}
            valueColor="text-yellow-600 dark:text-yellow-400"
            iconBg="bg-yellow-100 dark:bg-yellow-900/20"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-red-500" />}
            label="Failed"
            value={stats.failed}
            valueColor="text-red-600 dark:text-red-400"
            iconBg="bg-red-100 dark:bg-red-900/20"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <DocumentFilters
            search={search}
            onSearchChange={setSearch}
            fileType={fileType}
            onFileTypeChange={setFileType}
            status={status}
            onStatusChange={setStatus}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {filtered.length} document{filtered.length !== 1 ? 's' : ''}
            </span>
            <DocumentViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </div>
        </div>

        {viewMode === 'grid' ? (
          <DocumentGrid
            documents={paginated}
            onSelectForChat={handleSelectForChat}
            onDelete={handleDelete}
            onPreview={setPreviewDoc}
            loading={loading}
          />
        ) : (
          <DocumentList
            documents={paginated}
            onSelectForChat={handleSelectForChat}
            onDelete={handleDelete}
            onPreview={setPreviewDoc}
            loading={loading}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                  page === i + 1
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <UploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
        />

        <DocumentPreview
          document={previewDoc}
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          onChat={handleSelectForChat}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, valueColor, iconBg }: {
  icon: React.ReactNode
  label: string
  value: number
  valueColor?: string
  iconBg: string
}) {
  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={cn('text-xl sm:text-2xl font-bold text-slate-900 dark:text-white', valueColor)}>
            {value}
          </p>
        </div>
        <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
