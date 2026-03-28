'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, User, Bot, Sparkles, Loader2 } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { useDocumentStore } from '@/store/documents'
import type { Message } from '@/types/api'

export default function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputText, setInputText] = useState('')

  const {
    currentConversationId,
    messages,
    currentResponse,
    isProcessing,
    isConnected,
    sendMessage,
    connectWebSocket,
  } = useChatStore()

  const { selectedDocumentId } = useDocumentStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentResponse])

  useEffect(() => {
    connectWebSocket()
    return () => {
      // Cleanup is handled in the store
    }
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isProcessing) return

    await sendMessage(inputText.trim(), selectedDocumentId || undefined)
    setInputText('')
  }

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/80">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {selectedDocumentId && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Document selected</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {conversationMessages.length === 0 && currentResponse === '' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-xl">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <p className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Start a conversation</p>
            <p className="text-sm">Ask a question about your documents</p>
          </div>
        )}

        {conversationMessages.map((message: Message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start gap-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse gap-3' : 'gap-3'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`px-5 py-3 rounded-2xl shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {currentResponse && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[80%]">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-md">
                <p className="whitespace-pre-wrap leading-relaxed">{currentResponse}</p>
                {isProcessing && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question..."
            disabled={!isConnected || isProcessing}
            className="flex-1 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!isConnected || isProcessing || !inputText.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all hover:scale-105 disabled:hover:scale-100"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  )
}
