'use client'

import { FileText, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react'
import StatsCard from '@/components/StatsCard'

interface Stats {
  totalDocuments: number
  processedDocuments: number
  activeConversations: number
  totalQueries: number
}

interface StatsGridProps {
  stats: Stats
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const processingRate = stats.totalDocuments > 0
    ? Math.round((stats.processedDocuments / stats.totalDocuments) * 100)
    : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Documents"
        value={stats.totalDocuments}
        icon={FileText}
        color="blue"
      />
      <StatsCard
        title="Processed"
        value={stats.processedDocuments}
        icon={TrendingUp}
        color="green"
        trend={{ value: processingRate, isPositive: true }}
      />
      <StatsCard
        title="Conversations"
        value={stats.activeConversations}
        icon={MessageSquare}
        color="purple"
      />
      <StatsCard
        title="Total Queries"
        value={stats.totalQueries}
        icon={BarChart3}
        color="indigo"
      />
    </div>
  )
}
