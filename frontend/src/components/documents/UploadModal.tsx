'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getFileConfig, formatFileSize, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/document-utils'
import { Upload, X, Loader2, CheckCircle2, AlertCircle, FileUp } from 'lucide-react'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUpload: (files: File[]) => Promise<void>
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function UploadModal({ open, onClose, onUpload }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const valid = fileArray.filter(f => {
      if (f.size > MAX_FILE_SIZE) return false
      const ext = f.name.split('.').pop()?.toLowerCase()
      return ext && ACCEPTED_FILE_TYPES.includes(`.${ext}`)
    })
    const uploadFiles: UploadFile[] = valid.map(f => ({ file: f, progress: 0, status: 'pending' }))
    setFiles(prev => [...prev, ...uploadFiles])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || uploading) return
    setUploading(true)

    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error')
    setFiles(prev => prev.map(f =>
      pendingFiles.includes(f) ? { ...f, status: 'uploading' as const, progress: 0 } : f
    ))

    try {
      const fileToUpload = pendingFiles.map(f => f.file)
      await onUpload(fileToUpload)
      setFiles(prev => prev.map(f =>
        pendingFiles.includes(f) ? { ...f, status: 'success' as const, progress: 100 } : f
      ))
    } catch {
      setFiles(prev => prev.map(f =>
        pendingFiles.includes(f) ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
      ))
    } finally {
      setUploading(false)
    }
  }, [files, uploading, onUpload])

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }, [])

  const handleClose = useCallback(() => {
    if (uploading) return
    setFiles([])
    onClose()
  }, [uploading, onClose])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  if (!open) return null

  const hasPending = files.some(f => f.status === 'pending' || f.status === 'error')
  const hasSuccess = files.some(f => f.status === 'success')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className={cn(
        'relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700',
        'w-full max-w-2xl max-h-[85vh] flex flex-col',
        'animate-in fade-in zoom-in-95 duration-200'
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Documents</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Drag and drop files or click to browse
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            multiple
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl',
              'cursor-pointer transition-all duration-300',
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
            )}
          >
            <div className={cn(
              'p-4 rounded-2xl mb-4 transition-all duration-300',
              dragActive
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg scale-110'
                : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              <FileUp className={cn('w-10 h-10 transition-colors', dragActive ? 'text-white' : 'text-primary-500')} />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {dragActive ? 'Drop files here' : 'Drop files or click to upload'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              PDF, DOCX, XLSX, PPTX, TXT, MD, PNG, JPG, GIF
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Max 50MB per file
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Files ({files.length})
                </h3>
                {hasSuccess && (
                  <button
                    onClick={clearCompleted}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear completed
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((item, index) => {
                  const config = getFileConfig(item.file.name)
                  const Icon = config.icon

                  return (
                    <div
                      key={`${item.file.name}-${index}`}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                        item.status === 'success'
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
                          : item.status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                          : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bgLight, config.bgDark)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(item.file.size)}
                        </p>

                        {item.status === 'uploading' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        {item.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                        )}
                        {item.status === 'success' && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        {(item.status === 'pending' || item.status === 'error') && !uploading && (
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {hasPending && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {files.filter(f => f.status === 'pending' || f.status === 'error').length} files
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
