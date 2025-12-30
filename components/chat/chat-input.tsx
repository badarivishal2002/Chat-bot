"use client"

import { useRef } from 'react'
import { ModelSelector } from '../model-selector'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  attachedFiles: FileList | null
  setAttachedFiles: (files: FileList | null) => void
  selectedModel: string
  onModelChange: (model: string) => void
  status: string
  onSubmit: (e: React.FormEvent) => void
  onStop: () => void
  acceptedFileTypes: string
  attachTooltip: string
  canAttach: boolean
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Get file icon emoji based on file type
function getFileIcon(filename: string): string {
  const ext = filename.toLowerCase()
  if (ext.endsWith('.pdf')) return '📄'
  if (ext.endsWith('.doc') || ext.endsWith('.docx')) return '📝'
  if (ext.endsWith('.xls') || ext.endsWith('.xlsx')) return '📊'
  if (ext.endsWith('.ppt') || ext.endsWith('.pptx')) return '📊'
  if (ext.endsWith('.txt') || ext.endsWith('.md')) return '📄'
  if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.gif') || ext.endsWith('.webp')) return '🖼️'
  if (ext.endsWith('.csv')) return '📊'
  return '📎'
}

export function ChatInput({
  input,
  setInput,
  attachedFiles,
  setAttachedFiles,
  selectedModel,
  onModelChange,
  status,
  onSubmit,
  onStop,
  acceptedFileTypes,
  attachTooltip,
  canAttach
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const removeFile = (index: number) => {
    if (!attachedFiles) return
    const dt = new DataTransfer()
    Array.from(attachedFiles).forEach((f, i) => {
      if (i !== index) dt.items.add(f)
    })
    setAttachedFiles(dt.files.length > 0 ? dt.files : null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex-shrink-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 px-4 py-5">
      <div className="w-full max-w-4xl mx-auto">
        {/* Attached Files Preview */}
        {attachedFiles && attachedFiles.length > 0 && (
          <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
            {Array.from(attachedFiles).map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-input hover:border-primary transition-colors group"
              >
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate max-w-[200px]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 rounded hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Remove file"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="relative">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes}
            className="hidden"
            onChange={e => e.target.files && setAttachedFiles(e.target.files)}
            disabled={!canAttach}
          />

          {/* Main input container with border */}
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-900 shadow-lg hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-all">
            <div className="flex items-end gap-2 p-3">
              {/* Attach button */}
              <button
                type="button"
                aria-label="Attach"
                title={attachTooltip}
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAttach}
                className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${
                  canAttach ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8.5a5.5 5.5 0 00-11 0v8a3.5 3.5 0 107 0V9.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const form = e.currentTarget.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }
                }}
                placeholder="Message Chat App..."
                disabled={status !== 'ready'}
                rows={1}
                className="flex-1 min-w-0 px-3 py-3 text-base sm:text-lg bg-transparent border-none focus:outline-none disabled:opacity-50 resize-none overflow-y-auto text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                style={{ minHeight: '52px', maxHeight: '200px' }}
              />

              {status !== 'ready' ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop"
                  title="Stop"
                  className="h-11 w-11 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center shrink-0 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Send"
                  title="Send"
                  disabled={!input.trim() && !(attachedFiles && attachedFiles.length > 0)}
                  className="h-11 w-11 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Model selector at bottom right */}
            <div className="absolute bottom-2 right-14 z-10">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                disabled={status !== 'ready'}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
