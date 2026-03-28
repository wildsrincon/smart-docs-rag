import Link from 'next/link'
import { FileText, MessageSquare, Zap, Search } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-4xl text-center px-4">
        <div className="mb-8 inline-flex items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <Zap className="w-8 h-8 text-primary-600" />
        </div>
        
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          SmartDocs RAG Platform
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
          Upload your PDF documents and chat with AI-powered Retrieval Augmented Generation. 
          Get instant answers from your knowledge base.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <FileText className="w-10 h-10 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Document Upload</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Upload PDF files and process them instantly</p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <Search className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Intelligent Search</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Find relevant information in seconds</p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <MessageSquare className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">AI Chat</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Conversational AI with your documents</p>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all font-medium hover:scale-105"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium hover:shadow-lg"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
