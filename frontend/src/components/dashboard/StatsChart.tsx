'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { cn } from '@/lib/utils'

interface StatsChartProps {
  className?: string
}

const documentsOverTime = [
  { date: 'Jan', documents: 4 },
  { date: 'Feb', documents: 7 },
  { date: 'Mar', documents: 5 },
  { date: 'Apr', documents: 12 },
  { date: 'May', documents: 9 },
  { date: 'Jun', documents: 15 },
  { date: 'Jul', documents: 18 },
  { date: 'Aug', documents: 22 },
  { date: 'Sep', documents: 16 },
  { date: 'Oct', documents: 28 },
  { date: 'Nov', documents: 24 },
  { date: 'Dec', documents: 31 },
]

const queryDistribution = [
  { category: 'Mon', queries: 12 },
  { category: 'Tue', queries: 19 },
  { category: 'Wed', queries: 15 },
  { category: 'Thu', queries: 25 },
  { category: 'Fri', queries: 22 },
  { category: 'Sat', queries: 8 },
  { category: 'Sun', queries: 5 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        {payload[0].value} {payload[0].name}
      </p>
    </div>
  )
}

export default function StatsChart({ className }: StatsChartProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Documents Over Time
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload activity in the last 12 months
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={documentsOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDocuments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="fill-slate-500 dark:fill-slate-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-slate-500 dark:fill-slate-400"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="documents"
                name="documents"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#colorDocuments)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Queries This Week
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daily query distribution
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={queryDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12 }}
                className="fill-slate-500 dark:fill-slate-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-slate-500 dark:fill-slate-400"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="queries"
                name="queries"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
