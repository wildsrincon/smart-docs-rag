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
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo'
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconText: 'text-blue-600 dark:text-blue-400',
    glow: 'group-hover:shadow-blue-500/10',
    ring: 'ring-blue-500/20',
  },
  green: {
    gradient: 'from-emerald-500 to-green-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-400',
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    iconText: 'text-orange-600 dark:text-orange-400',
    glow: 'group-hover:shadow-orange-500/10',
    ring: 'ring-orange-500/20',
  },
  purple: {
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50 dark:bg-violet-950/50',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconText: 'text-violet-600 dark:text-violet-400',
    glow: 'group-hover:shadow-violet-500/10',
    ring: 'ring-violet-500/20',
  },
  indigo: {
    gradient: 'from-indigo-500 to-blue-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    glow: 'group-hover:shadow-indigo-500/10',
    ring: 'ring-indigo-500/20',
  },
  red: {
    gradient: 'from-rose-500 to-red-400',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    iconText: 'text-rose-600 dark:text-rose-400',
    glow: 'group-hover:shadow-rose-500/10',
    ring: 'ring-rose-500/20',
  },
}

export default function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const config = colorConfig[color]

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6',
        'border border-slate-200/80 dark:border-slate-800',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-xl',
        config.glow
      )}
    >
      <div
        className={cn(
          'absolute -right-4 -top-4 h-28 w-28 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300',
          'group-hover:opacity-[0.14]',
          `bg-gradient-to-br ${config.gradient}`
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={cn(
            'rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110',
            config.iconBg
          )}>
            <Icon className={cn('h-6 w-6', config.iconText)} strokeWidth={1.8} />
          </div>

          {trend && (
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
            )}>
              <span className="text-[10px]">{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
