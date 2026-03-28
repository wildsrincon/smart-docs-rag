'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, X, MessageSquare, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation, Message } from '@/types/api'

interface ChatSidebarProps {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => Promise<void>
  messages?: Record<string, Message[]>
}

function generateConversationSummary(messages: Message[]): string {
  if (!messages || messages.length === 0) return 'New Conversation'

  const userMessages = messages.filter(m => m.role === 'user').slice(0, 3)

  if (userMessages.length === 0) return 'New Conversation'

  const allContent = userMessages.map(m => m.content).join(' ')

  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'been', 'will', 'would',
    'could', 'should', 'about', 'which', 'their', 'there', 'what',
    'when', 'where', 'how', 'does', 'can', 'the', 'and', 'for',
    'are', 'but', 'not', 'you', 'all', 'has', 'was', 'were', 'they',
    'them', 'into', 'than', 'its', 'his', 'her', 'our', 'your',
    'tell', 'please', 'want', 'know', 'just', 'also', 'very',
    'more', 'some', 'like', 'need', 'make', 'does',
  ])

  const words = allContent
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))

  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))]

  const keywords = uniqueWords
    .slice(0, 5)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))

  const summary = keywords.join(', ')
  return summary.length > 60 ? summary.slice(0, 57) + '...' : summary
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ChatSidebar({
  open,
  onClose,
  conversations,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  messages = {},
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (deletingId === id) return

    setDeletingId(id)
    setErrorId(null)

    try {
      await onDelete(id)
    } catch {
      setErrorId(id)
      setTimeout(() => setErrorId(null), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  const sortedConversations = [...filtered].sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime()
    const dateB = new Date(b.updated_at).getTime()
    return dateB - dateA
  })

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
              {sortedConversations.map((conv) => {
                const convMessages = messages[conv.id] || []
                const summary = generateConversationSummary(convMessages)
                const isActive = selectedId === conv.id
                const isDeleting = deletingId === conv.id
                const hasError = errorId === conv.id

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelect(conv.id)}
                    className={cn(
                      'group relative flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent',
                      isDeleting && 'opacity-60 pointer-events-none'
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-800/40'
                            : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                        )}
                      >
                        <MessageSquare
                          className={cn(
                            'w-3.5 h-3.5',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-slate-400 dark:text-slate-500'
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate leading-tight',
                          isActive
                            ? 'text-primary-700 dark:text-primary-400'
                            : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {conv.title || 'New Conversation'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate leading-tight">
                        {summary}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600" />
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">
                          {conv.updated_at
                            ? formatRelativeTime(conv.updated_at)
                            : 'No messages yet'}
                        </span>
                      </div>
                    </div>

                    {hasError && (
                      <div className="shrink-0 mt-0.5" title="Failed to delete">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}

                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className={cn(
                        'shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
                        (deletingId === conv.id || hasError) && 'opacity-100'
                      )}
                      title="Delete conversation"
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary-500" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
