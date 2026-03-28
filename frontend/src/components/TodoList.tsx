'use client'

import { format } from 'date-fns'
import { useTodosStore } from '@/store/todos'
import { useShallow } from 'zustand/react/shallow'
import { Check, Trash2, Calendar, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_COLORS = {
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Top: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const PRIORITY_BORDERS = {
  Low: 'border-slate-200 dark:border-slate-800',
  Normal: 'border-blue-200 dark:border-blue-800',
  Medium: 'border-yellow-200 dark:border-yellow-800',
  High: 'border-orange-200 dark:border-orange-800',
  Top: 'border-red-200 dark:border-red-800',
}

interface Todo {
  id: string
  description: string
  priority: string
  is_completed: boolean
  due_date?: string | null
  completed_at?: string | null
}

function TodoItem({ todo }: { todo: Todo }) {
  const { completeTodo, deleteTodo, isLoading } = useTodosStore()

  const handleComplete = async () => {
    try {
      await completeTodo(todo.id)
    } catch (error) {
      // Error is already handled in store
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteTodo(todo.id)
      } catch (error) {
        // Error is already handled in store
      }
    }
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border p-5 transition-all hover:shadow-md',
        PRIORITY_BORDERS[todo.priority as keyof typeof PRIORITY_BORDERS],
        todo.is_completed && 'opacity-60 grayscale-[0.5]'
      )}
    >
      {/* Left accent border */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          {
            'bg-slate-400': todo.priority === 'Low',
            'bg-blue-500': todo.priority === 'Normal',
            'bg-yellow-500': todo.priority === 'Medium',
            'bg-orange-500': todo.priority === 'High',
            'bg-red-500': todo.priority === 'Top',
          }
        )}
      />

      <div className="flex items-start gap-4 pl-4">
        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={isLoading || todo.is_completed}
          className={cn(
            'mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110',
            todo.is_completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {todo.is_completed && <Check className="h-4 w-4" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p
                className={cn(
                  'text-base font-medium text-slate-900 dark:text-white',
                  todo.is_completed && 'line-through text-slate-500 dark:text-slate-400'
                )}
              >
                {todo.description}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold',
                    PRIORITY_COLORS[todo.priority as keyof typeof PRIORITY_COLORS]
                  )}
                >
                  {todo.priority}
                </span>

                {todo.due_date && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(todo.due_date), 'MMM d, yyyy')}
                  </span>
                )}

                {todo.is_completed && todo.completed_at && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
                    <Check className="h-3 w-3" />
                    Completed {format(new Date(todo.completed_at), 'MMM d')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TodoList() {
  const { todos } = useTodosStore(
    useShallow((state) => ({
      todos: state.todos,
    }))
  )

  const activeTodos = todos.filter((t) => !t.is_completed)
  const completedTodos = todos.filter((t) => t.is_completed)

  // Sort todos by priority (Top first) and due date
  const priorityOrder = { Top: 0, High: 1, Medium: 2, Normal: 3, Low: 4 }

  const sortedActiveTodos = [...activeTodos].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    if (priorityDiff !== 0) return priorityDiff

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })

  const sortedCompletedTodos = [...completedTodos].sort((a, b) => {
    if (!a.completed_at || !b.completed_at) return 0
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  })

  if (todos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No tasks yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Get started by creating your first task. It&apos;s quick and easy!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sortedActiveTodos.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Active Tasks
            <span className="text-sm font-normal text-slate-500">
              ({sortedActiveTodos.length})
            </span>
          </h2>
          <div className="space-y-3">
            {sortedActiveTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}

      {sortedCompletedTodos.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Completed
            <span className="text-sm font-normal text-slate-500">
              ({sortedCompletedTodos.length})
            </span>
          </h2>
          <div className="space-y-3">
            {sortedCompletedTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
