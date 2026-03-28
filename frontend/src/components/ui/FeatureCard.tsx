'use client'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
}

export default function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 hover:scale-105 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
