"use client"

import React, { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { CodeBlock } from '../code-block'
import { ToolCallCard } from '../tool-call-card'
import { detectArtifact } from '@/lib/artifact-detector'
import type { Artifact } from '../artifact-panel'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface MessageItemProps {
  message: any
  isUser: boolean
  isAssistant: boolean
  isStreaming: boolean
  userEmail?: string | null
  onOpenArtifact: (artifact: Artifact) => void
  renderToolContent?: (part: any) => ReactNode
}

const getFileIcon = (filename: string): string => {
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

const getUserInitial = (email?: string | null) => {
  if (!email) return 'U'
  return email.charAt(0).toUpperCase()
}

export function MessageItem({
  message,
  isUser,
  isAssistant,
  isStreaming,
  userEmail,
  onOpenArtifact,
  renderToolContent
}: MessageItemProps) {
  const [showTools, setShowTools] = useState(false)

  const textParts = Array.isArray(message.parts)
    ? message.parts.filter((part: any) => part.type === 'text')
    : []
  const fileParts = Array.isArray(message.parts)
    ? message.parts.filter((part: any) => (part as any).type === 'file')
    : []
  const toolParts = Array.isArray(message.parts)
    ? message.parts.filter((part: any) => typeof (part as any).type === 'string' && (part as any).type.startsWith('tool-'))
    : []

  const widthClasses = ''
  const colorClasses = isUser
    ? 'bg-blue-400 text-gray-900'
    : 'bg-gray-100 dark:bg-gray-800'

  return (
    <div
      className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 break-words overflow-hidden ${widthClasses} ${colorClasses}`}
    >
      {isAssistant ? (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {message.parts.map((part: any, index: number) => {
            if (part.type === 'text') {
              const isLastTextPart = index === message.parts.length - 1
              return (
                <div key={index} className="inline">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code: ({ children, className, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        const language = match ? match[1] : undefined
                        const isInline = !className?.includes('language-')
                        const codeString = String(children).replace(/\n$/, '')

                        if (isInline) {
                          return <CodeBlock inline={true}>{codeString}</CodeBlock>
                        }

                        const artifact = detectArtifact(`\`\`\`${language}\n${codeString}\n\`\`\``)

                        return (
                          <div className="relative group">
                            <CodeBlock language={language}>{codeString}</CodeBlock>
                            {artifact && (
                              <button
                                onClick={() => onOpenArtifact(artifact)}
                                className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                Open in Viewer
                              </button>
                            )}
                          </div>
                        )
                      },
                      pre: ({ children }) => <>{children}</>,
                      a: ({ children, href }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-300 dark:border-gray-600">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                          {children}
                        </td>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 my-3 ml-4">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 my-3 ml-4">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-900 dark:text-gray-100">
                          {children}
                        </li>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="my-3 text-gray-900 dark:text-gray-100 leading-relaxed">
                          {children}
                        </p>
                      ),
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                  {isStreaming && isLastTextPart && (
                    <span className="inline-block w-1 h-4 ml-0.5 bg-gray-900 dark:bg-gray-100 animate-pulse" />
                  )}
                </div>
              )
            }
            if ((part as any).type === 'file') {
              const p: any = part
              if (p.mediaType?.startsWith('image/')) {
                return (
                  <img key={index} src={p.url} alt="attachment" className="mt-2 max-w-full rounded border" />
                )
              }
              if (p.mediaType === 'application/pdf') {
                return (
                  <a key={index} href={p.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-primary underline">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    View PDF
                  </a>
                )
              }
              return null
            }
            if (typeof (part as any).type === 'string' && (part as any).type.startsWith('tool-')) {
              // Don't render tool calls inline - we'll show them in collapsible section below
              return null
            }
            return null
          })}

          {/* Collapsible tool usage section - ChatGPT-like */}
          {toolParts.length > 0 && !isStreaming && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {showTools ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {showTools ? 'Hide research steps' : `Show how I researched this (${toolParts.length} ${toolParts.length === 1 ? 'step' : 'steps'})`}
                </span>
              </button>

              {showTools && (
                <div className="mt-3 space-y-2">
                  {toolParts.map((part: any, index: number) => (
                    <div key={index}>
                      {renderToolContent?.(part)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 text-gray-900 dark:text-white">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                {textParts.length > 0
                  ? textParts.map((part: any, index: number) => <span key={`text-${message.id}-${index}`}>{part.text}</span>)
                  : <span className="text-xs opacity-80">Attachment shared</span>
                }
              </div>
            </div>
          </div>

          {fileParts.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {fileParts.map((part: any, index: number) => {
                const p: any = part

                if (p.mediaType?.startsWith('image/')) {
                  return (
                    <div key={`file-${index}`}>
                      <img src={p.url} alt={p.filename || 'attachment'} className="max-w-full max-h-96 rounded border border-white/20" />
                      {p.filename && (
                        <div className="text-xs mt-1 opacity-80">{p.filename}</div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={`file-${index}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                    <span className="text-lg">{getFileIcon(p.filename || '')}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{p.filename || 'Document'}</span>
                      <span className="text-xs opacity-70">
                        {p.mediaType?.split('/')[1]?.toUpperCase() || 'File'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {toolParts.length > 0 && toolParts.map((part: any, index: number) => (
            <div key={`tool-${index}`} className="mt-3">
              {renderToolContent?.(part)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
