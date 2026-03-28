'use client'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose dark:prose-invert max-w-none prose-sm">
      <ReactMarkdown
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={tomorrow}
              language={match[1]}
              PreTag="div"
              customStyle={{
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        a({ children, ...props }: any) {
          return (
            <a className="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          )
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blockquote({ children }: any) {
          return (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 dark:text-slate-400">
              {children}
            </blockquote>
          )
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ul({ children }: any) {
          return <ul className="list-disc pl-6 space-y-2">{children}</ul>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ol({ children }: any) {
          return <ol className="list-decimal pl-6 space-y-2">{children}</ol>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        li({ children }: any) {
          return <li className="text-slate-900 dark:text-slate-200">{children}</li>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h1({ children }: any) {
          return <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{children}</h1>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h2({ children }: any) {
          return <h2 className="text-xl font-bold mb-3 mt-6 text-slate-900 dark:text-white">{children}</h2>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h3({ children }: any) {
          return <h3 className="text-lg font-bold mb-2 mt-4 text-slate-900 dark:text-white">{children}</h3>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p({ children }: any) {
          return <p className="mb-4 text-slate-900 dark:text-slate-200 leading-relaxed">{children}</p>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        table({ children }: any) {
          return (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-300 dark:border-slate-600">{children}</table>
            </div>
          )
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thead({ children }: any) {
          return <thead className="bg-slate-100 dark:bg-slate-700">{children}</thead>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        th({ children }: any) {
          return <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900 dark:text-white">{children}</th>
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        td({ children }: any) {
          return <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-200 border-t border-slate-300 dark:border-slate-600">{children}</td>
        },
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
