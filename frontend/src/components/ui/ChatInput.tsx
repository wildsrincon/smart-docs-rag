'use client'
import { useState, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  loading?: boolean
}

export default function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled && !loading) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-3 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje..."
        disabled={disabled || loading}
        rows={1}
        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
      />
      <button
        onClick={handleSend}
        disabled={disabled || loading || !message.trim()}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        {loading ? '...' : 'Enviar'}
      </button>
    </div>
  )
}
