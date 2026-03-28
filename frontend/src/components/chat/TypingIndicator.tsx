'use client'

import { Bot } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in duration-300">
      <div className="flex items-start space-x-3 max-w-[80%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '150ms' }} />
            <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
