'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from '@/types/api'

interface DocumentTableProps {
  documents: Document[]
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  className?: string
}

type SortField = 'filename' | 'file_size' | 'status' | 'created_at'
type SortDir = 'asc' | 'desc'

const ITEMS_PER_PAGE = 5

function getFileType(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'pdf': return { type: 'PDF', icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-950/50' }
    case 'docx':
    case 'doc': return { type: 'DOCX', icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50' }
    case 'xlsx':
    case 'xls': return { type: 'XLSX', icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' }
    case 'pptx':
    case 'ppt': return { type: 'PPTX', icon: FileImage, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/50' }
    case 'txt': return { type: 'TXT', icon: File, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' }
    case 'md': return { type: 'MD', icon: File, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/50' }
    default: return { type: ext.toUpperCase(), icon: File, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' }
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1))
  return `${size} ${units[i]}`
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Processed
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </span>
      )
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {status}
        </span>
      )
  }
}

export default function DocumentTable({ documents, onDelete, onView, className }: DocumentTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const sorted = [...documents].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'filename': return dir * a.filename.localeCompare(b.filename)
      case 'file_size': return dir * (a.file_size - b.file_size)
      case 'status': return dir * a.status.localeCompare(b.status)
      case 'created_at': return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      default: return 0
    }
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary-500" />
      : <ChevronDown className="h-3 w-3 text-primary-500" />
  }

  if (documents.length === 0) {
    return (
      <div className={cn(
        'rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900',
        className
      )}>
        <div className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No documents yet</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Upload documents to see them here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-3.5">
                <button
                  onClick={() => toggleSort('filename')}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Document
                  <SortIcon field="filename" />
                </button>
              </th>
              <th className="px-6 py-3.5">
                <button
                  onClick={() => toggleSort('created_at')}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Date
                  <SortIcon field="created_at" />
                </button>
              </th>
              <th className="hidden px-6 py-3.5 sm:table-cell">
                <button
                  onClick={() => toggleSort('file_size')}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Size
                  <SortIcon field="file_size" />
                </button>
              </th>
              <th className="px-6 py-3.5">
                <button
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="hidden px-6 py-3.5 md:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Type
                </span>
              </th>
              <th className="px-6 py-3.5 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.map((doc) => {
              const fileType = getFileType(doc.filename)
              const FileTypeIcon = fileType.icon

              return (
                <tr
                  key={doc.id}
                  className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-lg p-2', fileType.color)}>
                        <FileTypeIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {doc.filename}
                        </p>
                        {doc.processed_chunks > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {doc.processed_chunks} chunks processed
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <span className={cn(
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                      fileType.color
                    )}>
                      {fileType.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {openMenuId === doc.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            {onView && (
                              <button
                                onClick={() => { onView(doc.id); setOpenMenuId(null) }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => { onDelete(doc.id); setOpenMenuId(null) }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
