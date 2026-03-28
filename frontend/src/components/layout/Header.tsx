'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Settings, LogOut, User, ChevronDown, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuthStore()
  const { toggle } = useSidebar()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    router.push('/')
  }

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-lg sm:px-6 dark:border-slate-700/50 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            SmartDocs
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">
              {user?.first_name || 'User'}
            </span>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 text-slate-400 transition-transform sm:block',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>

              <div className="p-1.5">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-slate-200 p-1.5 dark:border-slate-700">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
