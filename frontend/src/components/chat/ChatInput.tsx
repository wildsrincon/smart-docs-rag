'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
  loading: boolean
}

export default function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [inputText, setInputText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }

  useEffect(() => {
    adjustHeight()
  }, [inputText])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || disabled || loading) return
    onSend(inputText.trim())
    setInputText('')
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputText.trim() && !disabled && !loading) {
        onSend(inputText.trim())
        setInputText('')
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
        })
      }
    }
  }

  const canSend = inputText.trim().length > 0 && !disabled && !loading

  return (
    <form onSubmit={handleSend} className="relative">
      <div
        className={cn(
          'flex items-end gap-2 p-2 rounded-2xl border bg-white dark:bg-slate-800 transition-all duration-200',
          isFocused
            ? 'border-primary-400 dark:border-primary-600 ring-4 ring-primary-500/10 shadow-lg shadow-primary-500/5'
            : 'border-slate-200 dark:border-slate-700 shadow-sm'
        )}
      >
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask a question about your documents..."
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none px-3 py-2 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none max-h-40 leading-relaxed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        <div className="flex items-center gap-1 pb-0.5">
          {!isFocused && inputText.length === 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 pr-1">
              <CornerDownLeft className="w-3 h-3" />
              Enter
            </span>
          )}

          <button
            type="submit"
            disabled={!canSend}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              canSend
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            )}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
