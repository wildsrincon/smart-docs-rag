'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Loader2, UserPlus } from 'lucide-react'

const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    clearError()
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      })
      router.push('/dashboard')
    } catch (error) {
      // Error is already handled in the store
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-8 shadow-2xl">
          {/* Logo/Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-4 shadow-lg">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Start organizing your tasks today
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  First Name
                </label>
                <input
                  {...register('first_name')}
                  type="text"
                  id="first_name"
                  autoComplete="given-name"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Name
                </label>
                <input
                  {...register('last_name')}
                  type="text"
                  id="last_name"
                  autoComplete="family-name"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                 <input
                   {...register('email')}
                   type="email"
                   id="email"
                   autoComplete="email"
                   suppressHydrationWarning
                   className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 pl-11 text-slate-900 shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                   placeholder="you@example.com"
                 />
                <UserPlus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                autoComplete="new-password"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="•••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="•••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              suppressHydrationWarning
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Additional info */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
