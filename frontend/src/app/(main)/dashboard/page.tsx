'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, MessageSquare, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useDocumentStore } from '@/store/documents'
import { useChatStore } from '@/store/chat'
import StatsGrid from '@/components/dashboard/StatsGrid'
import StatsChart from '@/components/dashboard/StatsChart'
import DocumentTable from '@/components/dashboard/DocumentTable'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { documents, fetchDocuments, deleteDocument } = useDocumentStore()
  const { conversations, fetchConversations } = useChatStore()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated && user) {
      fetchDocuments()
      fetchConversations()
    }
  }, [isAuthenticated, authLoading, user, router, fetchDocuments, fetchConversations])

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  const stats = {
    totalDocuments: documents.length,
    processedDocuments: documents.filter(d => d.status === 'completed').length,
    activeConversations: conversations.length,
    totalQueries: 0,
  }

  async function handleDelete(id: string): Promise<boolean> {
    if (!confirm('Are you sure you want to delete this document?')) {
      return false
    }
    try {
      await deleteDocument(id)
      return true
    } catch {
      return false
    }
  }

  function handleView(id: string) {
    router.push(`/chat?document=${id}`)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.first_name}
          </h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Here&apos;s an overview of your SmartDocs activity
          </p>
        </div>

        <StatsGrid stats={stats} />

        <StatsChart />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/documents" className="group p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Upload Documents</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add new files to your library</p>
              </div>
            </div>
          </Link>

          <Link href="/chat" className="group p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 p-3 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Start Chat</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chat with your documents</p>
              </div>
            </div>
          </Link>

          <Link href="/documents" className="group p-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">AI Assistant</h4>
                <p className="mt-1 text-sm text-primary-100">Ask anything about your docs</p>
              </div>
            </div>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Documents</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {documents.length} document{documents.length !== 1 ? 's' : ''} in your library
              </p>
            </div>
            <Link href="/documents" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
              View All &rarr;
            </Link>
          </div>

          <DocumentTable
            documents={documents}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>
      </div>
    </div>
  )
}
