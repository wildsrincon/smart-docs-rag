'use client'

import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
  loading: boolean
}

export default function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [inputText, setInputText] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || disabled || loading) return

    onSend(inputText.trim())
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputText.trim() && !disabled && !loading) {
        onSend(inputText.trim())
        setInputText('')
      }
    }
  }

  return (
    <form onSubmit={handleSend} className="flex items-end gap-3">
      <button
        type="button"
        disabled={disabled}
        className="flex-shrink-0 p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors"
        title="Attach document"
      >
        <Paperclip className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={disabled}
          rows={1}
          className="w-full resize-none px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || loading || !inputText.trim()}
        className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <Send className="w-5 h-5 animate-pulse" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  )
}
