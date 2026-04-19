'use client'

import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Bot, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import CitationsList from '@/components/ui/CitationsList'
import type { Message } from '@/types/api'

interface MessageBubbleProps {
  message: Message
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(t)
    }
  }, [copied])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
  }

  return (
    <div className={cn('flex animate-in fade-in slide-in-from-bottom-1 duration-300', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex items-start gap-3 max-w-[85%] sm:max-w-[75%]',
          isUser && 'flex-row-reverse'
        )}
      >
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-primary-600'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        <div className={cn('flex flex-col gap-1', isUser && 'items-end')}>
          <div
            className={cn(
              'px-4 py-3 rounded-2xl shadow-sm',
              isUser
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-md'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            ) : (
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-pre:p-0 prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:before:content-[''] prose-code:after:content-['']">
                <div ref={contentRef}>
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')
                        return match ? (
                          <div className="relative group/code rounded-lg overflow-hidden">
                            <button
                              onClick={() => navigator.clipboard.writeText(codeString)}
                              className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700/80 text-slate-300 opacity-0 group-hover/code:opacity-100 transition-opacity hover:bg-slate-600"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <SyntaxHighlighter
                              language={match[1]}
                              PreTag="div"
                              style={oneDark}
                              className="!rounded-lg !text-sm !p-4"
                              customStyle={{
                                margin: 0,
                                background: 'rgb(15 23 42)',
                              }}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={cn(className, 'rounded-md px-1.5 py-0.5 text-sm')} {...props}>
                            {children}
                          </code>
                        )
                      },
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      blockquote({ children, ...props }: any) {
                        return (
                          <blockquote
                            className="border-l-4 border-primary-400 dark:border-primary-600 pl-4 italic text-slate-600 dark:text-slate-400 my-3"
                            {...props}
                          >
                            {children}
                          </blockquote>
                        )
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {message.citations && <CitationsList citations={message.citations} />}
              </div>
            )}
          </div>

          <div className={cn('flex items-center gap-1.5 px-1', isUser && 'flex-row-reverse')}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {formatTime(message.created_at)}
            </span>
            {!isUser && message.content && (
              <button
                onClick={handleCopy}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
