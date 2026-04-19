'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { LayoutGrid, List } from 'lucide-react'

type ViewMode = 'grid' | 'list'

interface DocumentViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function DocumentViewToggle({ viewMode, onViewModeChange }: DocumentViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          viewMode === 'grid'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        )}
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          viewMode === 'list'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  )
}

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const saved = localStorage.getItem('documents-view-mode') as ViewMode | null
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('documents-view-mode', mode)
  }

  return { viewMode, onViewModeChange: handleViewModeChange }
}
