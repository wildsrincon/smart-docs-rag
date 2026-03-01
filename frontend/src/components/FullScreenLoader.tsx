import { Loader2 } from 'lucide-react'

export default function FullScreenLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-slate-500 dark:text-slate-400">Restaurando sesión...</p>
      </div>
    </div>
  )
}
