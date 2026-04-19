'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Zap,
  X,
} from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ onLogout, onClose }: { onLogout: () => void; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          SmartDocs
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-700/50 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { isOpen, close } = useSidebar()
  const logout = useAuthStore(s => s.logout)
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
    close()
  }

  return (
    <>
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200 lg:dark:border-slate-700/50">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={close}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="absolute right-2 top-3 z-10">
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onLogout={handleLogout} onClose={close} />
          </aside>
        </div>
      )}
    </>
  )
}
