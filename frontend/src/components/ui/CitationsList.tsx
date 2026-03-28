'use client'

import { FileText, BookOpen } from 'lucide-react'
import type { Citation } from '@/types/api'

interface CitationsListProps {
  citations: Citation[]
}

export default function CitationsList({ citations }: CitationsListProps) {
  if (!citations || citations.length === 0) return null

  const uniqueDocs = citations.reduce<Citation[]>((acc, c) => {
    if (!acc.find(d => d.document_id === c.document_id)) {
      acc.push(c)
    }
    return acc
  }, [])

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-600/60">
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Fuentes
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {uniqueDocs.map((citation) => (
          <div
            key={citation.document_id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate max-w-[180px]" title={citation.document_name}>
              {citation.document_name}
            </span>
            {citation.page && (
              <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                p.{citation.page}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
