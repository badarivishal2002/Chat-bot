"use client"

import { Copy, Pencil, BookOpen, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Source {
  title: string
  url?: string
  snippet?: string
  source?: string
}

interface MessageActionsProps {
  message: any
  isUser: boolean
  isAssistant: boolean
  isLastMessage: boolean
  isStreamingThisMessage: boolean
  isEditableMessage: boolean
  editingMessageId: string | null
  copiedMessageId: string | null
  openSourcesPopoverId: string | null
  feedbackMessages: Record<string, 'up' | 'down'>
  isRegenerating: boolean
  status: string
  onCopy: (messageId: string) => void
  onEdit: (message: any) => void
  onRegenerate: () => void
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void
  onSourcesOpen: (messageId: string | null) => void
  extractSourcesFromMessage: (message: any) => Source[]
  formatMessageTime: (date?: Date | string | null) => string
  formatEditedLabel: (value?: Date | string) => string
}

export function MessageActions({
  message,
  isUser,
  isAssistant,
  isLastMessage,
  isStreamingThisMessage,
  isEditableMessage,
  editingMessageId,
  copiedMessageId,
  openSourcesPopoverId,
  feedbackMessages,
  isRegenerating,
  status,
  onCopy,
  onEdit,
  onRegenerate,
  onFeedback,
  onSourcesOpen,
  extractSourcesFromMessage,
  formatMessageTime,
  formatEditedLabel
}: MessageActionsProps) {
  const metadata = (message as any).metadata || {}
  const showUserActions = isEditableMessage && (!editingMessageId || editingMessageId === message.id)

  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Timestamp - shown before copy button for assistant messages */}
      {isAssistant && !isStreamingThisMessage && ((message as any).createdAt || metadata.createdAt) && (
        <span className="text-xs text-gray-500 dark:text-gray-500 font-normal normal-case tracking-normal">
          {formatMessageTime((message as any).createdAt || metadata.createdAt)}
        </span>
      )}

      {/* User message actions */}
      {isUser && showUserActions && (
        <>
          <button
            type="button"
            onClick={() => onEdit(message)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onCopy(message.id)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </button>
          {/* Timestamp - shown after copy button for user messages */}
          {((message as any).createdAt || metadata.createdAt) && (
            <span className="text-xs text-gray-500 dark:text-gray-500 font-normal normal-case tracking-normal">
              {formatMessageTime((message as any).createdAt || metadata.createdAt)}
            </span>
          )}
        </>
      )}

      {/* Assistant message actions */}
      {isAssistant && !isStreamingThisMessage && (() => {
        const sources = extractSourcesFromMessage(message)
        const hasSources = sources.length > 0
        const messageFeedback = feedbackMessages[message.id]

        return (
          <>
            <button
              type="button"
              onClick={() => onCopy(message.id)}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>

            {/* Regenerate button - only show on last assistant message */}
            {isLastMessage && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={status !== 'ready' || isRegenerating}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
              </button>
            )}

            {hasSources && (
              <Popover open={openSourcesPopoverId === message.id} onOpenChange={(open: boolean) => onSourcesOpen(open ? message.id : null)}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Sources</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96 max-h-[400px] overflow-y-auto" align="start">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Sources ({sources.length})</h4>
                    <div className="space-y-3">
                      {sources.map((source, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                          <div className="space-y-1">
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline block"
                              >
                                {source.title}
                              </a>
                            ) : (
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {source.title}
                              </div>
                            )}
                            {source.source && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {source.source}
                              </div>
                            )}
                            {source.snippet && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 italic mt-1 line-clamp-3">
                                "{source.snippet}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Feedback buttons */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => onFeedback(message.id, 'up')}
                className={`inline-flex items-center rounded-md p-2 transition-colors ${
                  messageFeedback === 'up'
                    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Good response"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onFeedback(message.id, 'down')}
                className={`inline-flex items-center rounded-md p-2 transition-colors ${
                  messageFeedback === 'down'
                    ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Bad response"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </>
        )
      })()}

      {/* Copied indicator */}
      {copiedMessageId === message.id && (
        <span className="text-gray-600 dark:text-gray-400">Copied</span>
      )}

      {/* Edited label for user messages */}
      {isUser && metadata?.edited && (
        <span className="text-gray-600 dark:text-gray-400">
          {formatEditedLabel(metadata?.editedAt)}
        </span>
      )}
    </div>
  )
}
