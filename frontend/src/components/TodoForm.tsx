'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTodosStore } from '@/store/todos'
import { Loader2, Plus, X } from 'lucide-react'
import { PRIORITY } from '@/types/api'
import { cn } from '@/lib/utils'

const todoSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  due_date: z.string().nullable(),
  priority: z.enum(['Normal', 'Low', 'Medium', 'High', 'Top']),
})

type TodoFormData = z.infer<typeof todoSchema>

interface TodoFormProps {
  onSuccess?: () => void
}

export default function TodoForm({ onSuccess }: TodoFormProps) {
  const { createTodo, isLoading } = useTodosStore()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      description: '',
      due_date: null,
      priority: 'Medium',
    },
  })

  const onSubmit = async (data: TodoFormData) => {
    try {
      await createTodo({
        description: data.description,
        due_date: data.due_date,
        priority: data.priority,
      })
      reset()
      setShowForm(false)
      onSuccess?.()
    } catch (error) {
      // Error is already handled in store
    }
  }

  const priorityOptions = [
    { value: 'Low', label: 'Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { value: 'Normal', label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    { value: 'Top', label: 'Top', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ]

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 transition-all hover:border-primary-500 hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-950 dark:hover:to-primary-900"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm transition-all group-hover:scale-110">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
              Add new task
            </span>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Task</h2>
            <button
              onClick={() => {
                reset()
                setShowForm(false)
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Task Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 resize-none transition-shadow focus:shadow-lg"
                placeholder="What needs to be done?"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="due_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                  <span className="ml-1 font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  {...register('due_date')}
                  type="date"
                  id="due_date"
                  suppressHydrationWarning
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white transition-shadow focus:shadow-lg"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  id="priority"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white transition-shadow focus:shadow-lg"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating task...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
