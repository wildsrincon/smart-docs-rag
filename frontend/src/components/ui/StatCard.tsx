'use client'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'purple'
}

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
