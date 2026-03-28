'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { useDocumentStore } from '@/store/documents'
import ConversationList from '@/components/chat/ConversationList'
import MessageList from '@/components/chat/MessageList'
import ChatInput from '@/components/chat/ChatInput'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { conversations, createConversation, selectConversation, currentConversationId, messages, isConnected, sendMessage, isProcessing, currentResponse, currentCitations, connectWebSocket, fetchConversations } = useChatStore()
  const { selectedDocumentId, fetchDocuments } = useDocumentStore()

  useEffect(() => {
    fetchConversations()
    fetchDocuments()
    connectWebSocket()
  }, [fetchConversations, fetchDocuments, connectWebSocket])

  const handleNewConversation = async () => {
    await createConversation()
  }

  const handleSendMessage = async (text: string) => {
    await sendMessage(text, selectedDocumentId || undefined)
  }

  const currentMessages = currentConversationId ? messages[currentConversationId] || [] : []

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">RAG Chat</h1>
        </div>
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Conversations</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedId={currentConversationId}
                onSelect={selectConversation}
                onCreate={handleNewConversation}
              />
            </div>
          </div>
        )}

        <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {selectedDocumentId && (
              <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full">
                Document selected
              </span>
            )}
          </div>

          <MessageList
            messages={currentMessages}
            isProcessing={isProcessing}
            currentResponse={currentResponse}
            currentCitations={currentCitations}
          />

          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <ChatInput
              onSend={handleSendMessage}
              disabled={!isConnected}
              loading={isProcessing}
            />
          </div>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg px-2 py-4 shadow-lg hover:shadow-xl transition-all"
        >
          <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      )}
    </div>
  )
}
