'use client'

import { MessageSquare, Sparkles, FileText, ArrowRight } from 'lucide-react'

interface EmptyStateProps {
  onSuggestionClick?: (text: string) => void
}

const suggestions = [
  { icon: FileText, label: 'Summarize my documents', query: 'Summarize the key points from my uploaded documents' },
  { icon: Sparkles, label: 'Analyze findings', query: 'What are the main findings across all my documents?' },
  { icon: ArrowRight, label: 'Quick question', query: 'What information do you have available?' },
]

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mb-6 shadow-sm">
        <MessageSquare className="w-8 h-8 text-primary-500 dark:text-primary-400" />
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
        Start a conversation
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
        Ask questions about your documents, get summaries, or explore insights from your uploaded content.
      </p>

      {onSuggestionClick && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.query}
              onClick={() => onSuggestionClick(suggestion.query)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group text-center"
            >
              <suggestion.icon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                {suggestion.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
