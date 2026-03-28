'use client'

import Link from 'next/link'
import { FileText, MessageSquare, LogOut, User } from 'lucide-react'

interface NavigationSidebarProps {
  onLogout: () => void
}

export default function NavigationSidebar({ onLogout }: NavigationSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">SmartDocs</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>

        <Link
          href="/documents"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <FileText className="h-5 w-5" />
          Documents
        </Link>

        <Link
          href="/chat"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <MessageSquare className="h-5 w-5" />
          Chat
        </Link>
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
