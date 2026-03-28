'use client'

import { useEffect, useState } from 'react'
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import { useDocumentStore } from '@/store/documents'
import ConversationList from '@/components/chat/ConversationList'
import MessageList from '@/components/chat/MessageList'
import ChatInput from '@/components/chat/ChatInput'

export default function ChatPage() {
  const [convSidebarOpen, setConvSidebarOpen] = useState(true)
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
  } = useChatStore()
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
    <div className="flex h-full">
      {convSidebarOpen && (
        <div className="w-72 shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Conversations</h2>
            <button
              onClick={() => setConvSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <PanelLeftClose className="h-5 w-5" />
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

      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {!convSidebarOpen && (
              <button
                onClick={() => setConvSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedDocumentId && (
              <span className="hidden sm:inline text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full">
                Document selected
              </span>
            )}
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
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
  )
}
