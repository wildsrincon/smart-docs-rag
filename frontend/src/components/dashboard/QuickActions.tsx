'use client'

import Link from 'next/link'
import { FileText, MessageSquare } from 'lucide-react'

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link
        href="/documents"
        className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 hover:scale-105"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Upload Documents</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Add new PDFs to your library</p>
          </div>
        </div>
      </Link>

      <Link
        href="/chat"
        className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 hover:scale-105"
      >
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
  )
}
