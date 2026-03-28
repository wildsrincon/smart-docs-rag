'use client'

import DocumentUpload from '@/components/DocumentUpload'

export default function UploadSection() {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
        Upload Document
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Add PDFs to your knowledge base
      </p>
      <DocumentUpload />
    </div>
  )
}
