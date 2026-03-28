'use client'
import { MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date | string
}

interface ConversationItemProps {
  conversation: Conversation
  onSelect: (conversation: Conversation) => void
  isActive: boolean
}

export default function ConversationItem({ conversation, onSelect, isActive }: ConversationItemProps) {
  const timestampDate = typeof conversation.timestamp === 'string' ? new Date(conversation.timestamp) : conversation.timestamp

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${
          isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
        }`}>
          <MessageSquare className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1 truncate">{conversation.title}</h4>
          <p className={`text-xs line-clamp-2 ${isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
            {conversation.lastMessage}
          </p>
          <p className={`text-xs mt-2 ${isActive ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
            {format(timestampDate, 'HH:mm')}
          </p>
        </div>
      </div>
    </button>
  )
}
