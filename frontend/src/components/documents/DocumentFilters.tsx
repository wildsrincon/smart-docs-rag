'use client'

import { cn } from '@/lib/utils'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import type { FileType, DocumentStatus } from '@/lib/document-utils'
import { FILE_TYPE_CONFIG, STATUS_CONFIG } from '@/lib/document-utils'
import { useState } from 'react'

interface DocumentFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  fileType: FileType | 'all'
  onFileTypeChange: (type: FileType | 'all') => void
  status: DocumentStatus | 'all'
  onStatusChange: (status: DocumentStatus | 'all') => void
  dateRange: 'all' | 'today' | 'week' | 'month'
  onDateRangeChange: (range: 'all' | 'today' | 'week' | 'month') => void
}

export default function DocumentFilters({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: DocumentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const hasActiveFilters = fileType !== 'all' || status !== 'all' || dateRange !== 'all'

  const clearFilters = () => {
    onFileTypeChange('all')
    onStatusChange('all')
    onDateRangeChange('all')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
            showFilters || hasActiveFilters
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary-500 text-white text-xs">
              {[fileType !== 'all', status !== 'all', dateRange !== 'all'].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-1">Type:</span>
            <button
              onClick={() => onFileTypeChange('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                fileType === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              All
            </button>
            {Object.entries(FILE_TYPE_CONFIG).map(([type, config]) => (
              <button
                key={type}
                onClick={() => onFileTypeChange(type as FileType)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                  fileType === type
                    ? `${config.bgLight} ${config.bgDark} ${config.color}`
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                )}
              >
                {config.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-1">Status:</span>
            <button
              onClick={() => onStatusChange('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                status === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              All
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => onStatusChange(key as DocumentStatus)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                  status === key
                    ? `${config.bgLight} ${config.bgDark} ${config.color}`
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
                {config.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-1">Date:</span>
            {([
              ['all', 'All time'],
              ['today', 'Today'],
              ['week', 'This week'],
              ['month', 'This month'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => onDateRangeChange(value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  dateRange === value
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
