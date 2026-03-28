'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useDocumentStore } from '@/store/documents'
import { useChatStore } from '@/store/chat'
import StatsGrid from '@/components/dashboard/StatsGrid'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { documents, fetchDocuments } = useDocumentStore()
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

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {user?.first_name}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Here&apos;s an overview of your SmartDocs activity
          </p>
        </div>

        <StatsGrid stats={stats} />

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/documents" className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:scale-[1.02]">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Upload Documents</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Add new files to your library</p>
                </div>
              </div>
            </Link>

            <Link href="/chat" className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:scale-[1.02]">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Start Chat</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Chat with your documents</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Documents</h3>
            <Link href="/documents" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View All &rarr;
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No documents yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                <Link href="/documents" className="text-primary-600 hover:underline">
                  Upload your first document &rarr;
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.slice(0, 6).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : doc.status === 'processing'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {doc.status}
                        </span>
                        {doc.processed_chunks > 0 && (
                          <span className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {doc.processed_chunks} chunks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
