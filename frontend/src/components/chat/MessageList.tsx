'use client'

import { useRef, useEffect } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import MessageBubble from '@/components/ui/MessageBubble'
import CitationsList from '@/components/ui/CitationsList'
import type { Message, Citation } from '@/types/api'

interface MessageListProps {
  messages: Message[]
  isProcessing: boolean
  currentResponse: string
  currentCitations?: Citation[]
}

export default function MessageList({ messages, isProcessing, currentResponse, currentCitations }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentResponse, currentCitations])

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.length === 0 && currentResponse === '' && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
          <div className="p-4 rounded-full bg-slate-200 dark:bg-slate-700 mb-4">
            <Bot className="w-12 h-12 text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Ask a question about your documents</p>
        </div>
      )}

      {messages.map((message: Message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {currentResponse && (
        <div className="flex justify-start">
          <div className="flex items-start space-x-3 max-w-[80%]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
              <p className="whitespace-pre-wrap">{currentResponse}</p>
              {isProcessing && (
                <span className="inline-flex items-center gap-1 ml-1">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </span>
              )}
              {!isProcessing && currentCitations && currentCitations.length > 0 && (
                <CitationsList citations={currentCitations} />
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
