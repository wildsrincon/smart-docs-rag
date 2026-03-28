'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, X, Sparkles, Loader2 } from 'lucide-react'
import { useDocumentStore } from '@/store/documents'

export default function DocumentUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const { uploadDocument, loading, error, clearError } = useDocumentStore()

  const handleFileSelect = async (file: File) => {
    clearError()
    try {
      await uploadDocument(file)
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        handleFileSelect(file)
      } else {
        alert('Please upload a PDF file')
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl
          cursor-pointer transition-all duration-300
          ${dragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-[1.02]' 
            : 'border-slate-300 hover:border-blue-400 bg-white dark:bg-slate-800 hover:shadow-lg hover:scale-[1.01]'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 mb-4 text-blue-500 animate-spin" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Processing...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This may take a moment
            </p>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
              dragActive 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg' 
                : 'bg-blue-100 dark:bg-blue-900'
            }`}>
              <Upload className={`w-10 h-10 ${dragActive ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {dragActive ? 'Drop your PDF here' : 'Upload Document'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              or click to browse files
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
              <FileText className="w-4 h-4" />
              <span>PDF files only • Max 10MB</span>
            </div>
            <div className="absolute top-4 right-4">
              <Sparkles className={`w-5 h-5 ${dragActive ? 'text-white' : 'text-slate-400'}`} />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-lg">
              <X className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
          <button 
            onClick={clearError} 
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
    </div>
  )
}
