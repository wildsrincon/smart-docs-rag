'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, X, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/api'

interface ChatSidebarProps {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export default function ChatSidebar({
  open,
  onClose,
  conversations,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    onDelete(id)
    setTimeout(() => setDeletingId(null), 300)
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed md:relative z-50 md:z-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ease-in-out w-72 shrink-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversations
          </h2>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onCreate}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">
                {search ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={cn(
                    'group relative flex items-center p-2.5 rounded-xl cursor-pointer transition-all duration-150',
                    selectedId === conv.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        selectedId === conv.id
                          ? 'text-primary-700 dark:text-primary-400'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {conv.title || 'New Conversation'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {conv.updated_at
                        ? new Date(conv.updated_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No messages yet'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
                      deletingId === conv.id && 'opacity-100'
                    )}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {selectedId === conv.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
