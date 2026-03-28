'use client'

import { useEffect, useState } from 'react'
import { Plus, PanelLeft } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { useDocumentStore } from '@/store/documents'
import ChatSidebar from '@/components/chat/ChatSidebar'
import MessageList from '@/components/chat/MessageList'
import ChatInput from '@/components/chat/ChatInput'
import LanguageSelector from '@/components/chat/LanguageSelector'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const {
    conversations,
    createConversation,
    selectConversation,
    currentConversationId,
    messages,
    isConnected,
    sendMessage,
    isProcessing,
    currentResponse,
    currentCitations,
    connectWebSocket,
    fetchConversations,
    deleteConversation,
    error,
    clearError,
    setLanguage,
  } = useChatStore()
  const { selectedDocumentId, fetchDocuments } = useDocumentStore()

  useEffect(() => {
    fetchConversations()
    fetchDocuments()
    connectWebSocket()
  }, [fetchConversations, fetchDocuments, connectWebSocket])

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [])

  const handleNewConversation = async () => {
    await createConversation()
  }

  const handleSendMessage = async (text: string) => {
    if (error) clearError()
    await sendMessage(text, selectedDocumentId || undefined)
  }

  const handleSuggestionClick = async (text: string) => {
    if (!currentConversationId) {
      await createConversation()
    }
    await sendMessage(text, selectedDocumentId || undefined)
  }

  const currentMessages = currentConversationId ? messages[currentConversationId] || [] : []
  const hasConversation = currentConversationId !== null

  return (
    <div className="flex h-full relative">
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        selectedId={currentConversationId}
        onSelect={selectConversation}
        onCreate={handleNewConversation}
        onDelete={deleteConversation}
        messages={messages}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full transition-colors', isConnected ? 'bg-emerald-500' : 'bg-red-400')} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector onChangeLang={setLanguage} />
            {selectedDocumentId && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 px-2.5 py-1 rounded-full">
                Document selected
              </span>
            )}
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm font-medium active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 sm:px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/40">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <MessageList
          messages={currentMessages}
          isProcessing={isProcessing}
          currentResponse={currentResponse}
          currentCitations={currentCitations}
          onSuggestionClick={handleSuggestionClick}
          hasConversation={hasConversation}
        />

        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={!isConnected}
              loading={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
