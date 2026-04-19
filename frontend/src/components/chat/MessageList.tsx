'use client'

import { useRef, useEffect } from 'react'
import { Bot } from 'lucide-react'
import MessageBubble from '@/components/chat/MessageBubble'
import TypingIndicator from '@/components/chat/TypingIndicator'
import EmptyState from '@/components/chat/EmptyState'
import CitationsList from '@/components/ui/CitationsList'
import type { Message, Citation } from '@/types/api'

interface MessageListProps {
  messages: Message[]
  isProcessing: boolean
  currentResponse: string
  currentCitations?: Citation[]
  onSuggestionClick?: (text: string) => void
  hasConversation: boolean
}

export default function MessageList({
  messages,
  isProcessing,
  currentResponse,
  currentCitations,
  onSuggestionClick,
  hasConversation,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentResponse])

  const showEmpty = messages.length === 0 && currentResponse === '' && !isProcessing
  const showTyping = isProcessing && currentResponse === ''

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      {showEmpty && (
        <div className="h-full">
          <EmptyState onSuggestionClick={onSuggestionClick} />
        </div>
      )}

      {!showEmpty && (
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((message: Message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {showTyping && <TypingIndicator />}

          {currentResponse && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{currentResponse}</p>
                    </div>
                    {isProcessing && (
                      <span className="inline-flex items-center gap-1 ml-1 mt-1">
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-500" style={{ animationDelay: '0ms' }} />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-500" style={{ animationDelay: '150ms' }} />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-500" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                    {!isProcessing && currentCitations && currentCitations.length > 0 && (
                      <CitationsList citations={currentCitations} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      )}
    </div>
  )
}
