'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useTodosStore } from '@/store/todos'
import { useStatsStore } from '@/store/stats'
import StatsCard from '@/components/StatsCard'
import PriorityChart from '@/components/PriorityChart'
import TodoForm from '@/components/TodoForm'
import TodoList from '@/components/TodoList'
import { Loader2, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore()
  const { todos, isLoading: todosLoading, fetchTodos } = useTodosStore()
  const { stats, isLoading: statsLoading, fetchStats } = useStatsStore()

  useEffect(() => {
    // AuthProvider garantiza que este componente solo se renderice
    // después de que se haya restaurado la sesión.
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (isAuthenticated && user) {
      // Cargar datos solo si está autenticado y el usuario existe
      fetchStats()
      if (todos.length === 0) {
        fetchTodos()
      }
    }
  }, [isAuthenticated, authLoading, user, router, fetchStats, fetchTodos, todos.length])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const completionRate = stats?.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg dark:border-slate-800/50 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Tasks"
              value={stats?.total || 0}
              icon={TrendingUp}
              color="blue"
            />
            <StatsCard
              title="Completed"
              value={stats?.completed || 0}
              icon={CheckCircle2}
              color="green"
            />
            <StatsCard
              title="Pending"
              value={stats?.pending || 0}
              icon={Clock}
              color="orange"
            />
            <StatsCard
              title="Completion Rate"
              value={`${completionRate}%`}
              icon={AlertCircle}
              color="purple"
              trend={{ value: 12, isPositive: true }}
            />
          </div>
        </div>

        {/* Charts and Form Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            {stats && !statsLoading && <PriorityChart data={stats.by_priority} />}
          </div>

          <div className="lg:col-span-2">
            <TodoForm onSuccess={() => { fetchStats(); fetchTodos() }} />
          </div>
        </div>

        {/* Todos Section */}
        <div className="mt-8">
          {stats?.completed_this_week !== undefined && stats.completed_this_week > 0 && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-white/20 p-3">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90">Great progress!</p>
                  <p className="text-2xl font-bold">
                    {stats.completed_this_week} tasks completed this week
                  </p>
                </div>
              </div>
            </div>
          )}

          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Your Tasks</h2>
          {todosLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <TodoList />
          )}
        </div>
      </main>
    </div>
  )
}
