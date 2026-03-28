'use client'

export default function TipsSection() {
  const tips = [
    'Upload clear, well-formatted PDFs for better extraction',
    'Documents are automatically chunked and indexed',
    'Select documents before starting a chat conversation',
    'Processing time depends on document size and complexity',
  ]

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800/50">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        💡 Tips for Best Results
      </h3>
      <ul className="space-y-3">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
