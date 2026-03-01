import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6 text-primary-600">
          Fullstack Starter Kit
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
          A modern fullstack boilerplate with Next.js 15 and FastAPI
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
