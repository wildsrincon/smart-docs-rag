'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/types/api'
import CitationsList from '@/components/ui/CitationsList'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-start space-x-3 max-w-[80%] ${
          isUser ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500' : 'bg-green-500'
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    code({ className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <SyntaxHighlighter
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg text-sm"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.citations && (
                <CitationsList citations={message.citations} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
