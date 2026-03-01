'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
  green: 'from-green-500 to-green-600 shadow-green-500/20',
  orange: 'from-orange-500 to-orange-600 shadow-orange-500/20',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
  red: 'from-red-500 to-red-600 shadow-red-500/20',
}

const bgClasses = {
  blue: 'bg-blue-50 dark:bg-blue-950',
  green: 'bg-green-50 dark:bg-green-950',
  orange: 'bg-orange-50 dark:bg-orange-950',
  purple: 'bg-purple-50 dark:bg-purple-950',
  red: 'bg-red-50 dark:bg-red-950',
}

const iconBgClasses = {
  blue: 'bg-blue-500 dark:bg-blue-600',
  green: 'bg-green-500 dark:bg-green-600',
  orange: 'bg-orange-500 dark:bg-orange-600',
  purple: 'bg-purple-500 dark:bg-purple-600',
  red: 'bg-red-500 dark:bg-red-600',
}

export default function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg',
        'border border-slate-200 dark:border-slate-800'
      )}
    >
      {/* Gradient background decoration */}
      <div
        className={cn(
          'absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl',
          `bg-gradient-to-br ${colorClasses[color]}`
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={cn('rounded-xl p-3', iconBgClasses[color])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {trend.isPositive ? '↑' : '↓'}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
