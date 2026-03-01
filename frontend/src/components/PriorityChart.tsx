'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PriorityChartProps {
  data: Record<string, number>
}

const COLORS = {
  'Top': '#ef4444',
  'High': '#f97316',
  'Medium': '#eab308',
  'Normal': '#3b82f6',
  'Low': '#6b7280',
}

const PRIORITY_ORDER = ['Top', 'High', 'Medium', 'Normal', 'Low']

export default function PriorityChart({ data }: PriorityChartProps) {
  // Convert data to array and sort by priority
  const chartData = PRIORITY_ORDER
    .filter((priority) => data[priority] > 0)
    .map((priority) => ({
      name: priority,
      value: data[priority],
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg border border-slate-200 dark:border-slate-800">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">By Priority</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
