'use client'

import { Plus } from 'lucide-react'
import type { Conversation } from '@/types/api'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

export default function ConversationList({ conversations, selectedId, onSelect, onCreate }: ConversationListProps) {
  return (
    <div className="p-4">
      <button
        onClick={onCreate}
        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium mb-4"
      >
        <Plus className="w-4 h-4" />
        <span>New Conversation</span>
      </button>

      <div className="space-y-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left p-3 rounded-xl transition-all ${
              selectedId === conv.id
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                  {conv.title || 'New Conversation'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                  {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : 'No messages yet'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
