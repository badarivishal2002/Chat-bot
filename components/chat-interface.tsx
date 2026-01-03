"use client"

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import React, { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useChatLayout } from '@/lib/chat-layout-context'
import { getAcceptedFileTypes, getAttachTooltip, isDocumentFile } from './model-selector'
import { ToolCallCard } from './tool-call-card'
import { ArtifactPanel, type Artifact } from './artifact-panel'
import { MessageItem } from './chat/message-item'
import { MessageActions } from './chat/message-actions'
import { ChatInput } from './chat/chat-input'
import { ThinkingIndicator } from './chat/thinking-indicator'
import 'katex/dist/katex.min.css'
import { useSession } from 'next-auth/react'
import { Menu, AlertCircle, TrendingUp, FolderInput, Share2, Link, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { AddToProjectModal } from '@/components/add-to-project-modal'

interface ChatInterfaceProps {
  chatId?: string
  chatTitle?: string
  onChatUpdate?: () => void
  onTitleUpdate?: (chatId: string, newTitle: string) => void
  onToggleSidebar?: () => void
}

async function convertFilesToDataURLs(files: FileList) {
  return Promise.all(
    Array.from(files).map(
      file =>
        new Promise<{ type: 'file'; filename: string; mediaType: string; url: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              type: 'file',
              filename: file.name,
              mediaType: file.type || 'application/octet-stream',
              url: reader.result as string
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )
  )
}

const isPersistentMessageId = (value?: string): boolean =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)

interface Source {
  title: string
  url?: string
  snippet?: string
  source?: string
  document_name?: string
  document_url?: string
  text_snippet?: string
}

const convertServerMessage = (msg: any) => ({
  id: msg.id,
  role: msg.role,
  parts: [{ type: 'text', text: msg.content || '' }],
  createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
  metadata: {
    edited: Boolean(msg.edited),
    editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
    persisted: true,
    sources: msg.sources || []
  }
})

const extractSourcesFromMessage = (message: any): Source[] => {
  if (message?.metadata?.sources && Array.isArray(message.metadata.sources)) {
    return message.metadata.sources.map((s: any) => ({
      title: s.document_name || s.title || 'Untitled',
      url: s.document_url || s.url,
      snippet: s.text_snippet || s.snippet,
      source: s.source
    }))
  }

  if (message?.sources && Array.isArray(message.sources)) {
    return message.sources.map((s: any) => ({
      title: s.document_name || s.title || 'Untitled',
      url: s.document_url || s.url,
      snippet: s.text_snippet || s.snippet,
      source: s.source
    }))
  }

  return []
}

const extractMessageText = (message: any): string =>
  Array.isArray(message?.parts)
    ? message.parts
        .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('\n')
        .trim()
    : ''

const formatEditedLabel = (value?: Date | string): string => {
  if (!value) return 'Edited'
  try {
    const parsed = typeof value === 'string' ? new Date(value) : value
    return `Edited • ${parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  } catch {
    return 'Edited'
  }
}

const formatMessageTime = (date?: Date | string | null): string => {
  if (!date) return ''
  try {
    const parsed = typeof date === 'string' ? new Date(date) : date
    return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear()
}

const formatDateSeparator = (date: Date): string => {
  const dayOfWeek = date.toLocaleDateString([], { weekday: 'short' })
  const day = date.getDate()
  const month = date.toLocaleDateString([], { month: 'short' })
  const ordinal = getOrdinalSuffix(day)
  return `${dayOfWeek}, ${day}${ordinal} ${month}`
}

const getUserInitial = (email?: string | null) => {
  if (!email) return 'U'
  return email.charAt(0).toUpperCase()
}

export function ChatInterface({ chatId, chatTitle = 'New Chat', onChatUpdate, onTitleUpdate, onToggleSidebar }: ChatInterfaceProps) {
  const router = useRouter()
  const { setCurrentChatId, setChatHistory } = useChatLayout()
  const [activeChatId, setActiveChatId] = useState<string | undefined>(chatId)
  const titlePollRef = useRef<number | null>(null)
  const titlePolledForChatRef = useRef<string | null>(null)
  const [tokenLimitError, setTokenLimitError] = useState<{message: string, resetAt?: string} | null>(null)
  const tokenLimitErrorRef = useRef<typeof setTokenLimitError>(setTokenLimitError)

  useEffect(() => {
    tokenLimitErrorRef.current = setTokenLimitError
  }, [setTokenLimitError])

  const customTransport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat'
  }), [])

  const { messages, sendMessage, status, setMessages, stop, error: chatError } = useChat({
    transport: customTransport,
    onError: (error) => {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        parts: [{
          type: 'text',
          text: '⚠️ **Something went wrong while processing your message.**\n\nPlease try:\n1. Sending your message again\n2. Refreshing the page if the issue persists\n3. Simplifying your question if it was very complex\n\nI apologize for the inconvenience!'
        }],
        createdAt: new Date()
      }])
    },
    onFinish: async (result) => {
      setTokenLimitError(null)

      if (streamingSourcesRef.current && result?.message && result.message.role === 'assistant') {
        pendingSourcesMessageIdRef.current = result.message.id
      } else {
        streamingSourcesRef.current = null
        pendingSourcesMessageIdRef.current = null
      }

      if (activeChatId && !activeChatId.startsWith('temp-chat-') && chatTitle === 'New Chat') {
        if (titlePollRef.current) window.clearInterval(titlePollRef.current)
        titlePolledForChatRef.current = activeChatId
        let attempts = 0
        titlePollRef.current = window.setInterval(async () => {
          attempts += 1
          try {
            const response = await fetch(`/api/chat/${activeChatId}/title`, { method: 'POST' })
            if (response.ok) {
              const data = await response.json()
              if (data.title && data.title !== 'New Chat') {
                onTitleUpdate?.(activeChatId, data.title)
                if (titlePollRef.current) window.clearInterval(titlePollRef.current)
                titlePollRef.current = null
              }
            }
          } catch {}
          if (attempts >= 3) {
            if (titlePollRef.current) window.clearInterval(titlePollRef.current)
            titlePollRef.current = null
          }
        }, 3000)
      }
    }
  })

  // Intercept fetch for token limits and sources
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      let urlString = ''
      try {
        if (typeof args[0] === 'string') {
          urlString = args[0]
        } else if (args[0] instanceof Request) {
          urlString = args[0].url
        } else if (args[0] instanceof URL) {
          urlString = args[0].href
        }
      } catch (error) {
        return response
      }

      const isChatApi = urlString && (/\/api\/chat(\?|$)/.test(urlString) || urlString.endsWith('/api/chat'))

      if (isChatApi && response.status === 429) {
        const clonedResponse = response.clone()
        clonedResponse.json().then(data => {
          setTokenLimitError({
            message: data.message,
            resetAt: data.resetAt
          })
        }).catch(() => {})

        return new Response(
          new ReadableStream({
            start(controller) {
              controller.close()
            }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' }
          }
        )
      }

      if (isChatApi && response.status === 200) {
        try {
          const sourcesHeader = response.headers.get('X-Chat-Sources')
          if (sourcesHeader) {
            try {
              const sources = JSON.parse(sourcesHeader)
              if (sources && Array.isArray(sources) && sources.length > 0) {
                streamingSourcesRef.current = sources
              }
            } catch (error) {
              console.error('Error parsing sources header:', error)
            }
          }
        } catch (error) {
          console.error('Error reading sources header:', error)
        }
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [setMessages])

  const [input, setInput] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState(chatTitle)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesAreaRef = useRef<HTMLDivElement>(null)
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<FileList | null>(null)
  const isCreatingNewChat = useRef(false)
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedModel, setSelectedModel] = useState('gpt-4.1')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [openSourcesPopoverId, setOpenSourcesPopoverId] = useState<string | null>(null)
  const [isAddToProjectOpen, setIsAddToProjectOpen] = useState(false)
  const streamingSourcesRef = useRef<Source[] | null>(null)
  const pendingSourcesMessageIdRef = useRef<string | null>(null)
  const { data: session } = useSession()
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, 'up' | 'down'>>({})
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null)
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false)

  // Attach sources to messages after they're finalized
  useEffect(() => {
    if (streamingSourcesRef.current && pendingSourcesMessageIdRef.current && status === 'ready' && messages.length > 0) {
      const messageId = pendingSourcesMessageIdRef.current
      const sourcesToAttach = streamingSourcesRef.current

      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        const targetMessage = messages[messageIndex]
        const metadata = targetMessage.metadata as any
        if (!metadata?.sources || (Array.isArray(metadata.sources) && metadata.sources.length === 0)) {
          setMessages(prev => {
            const prevMessageIndex = prev.findIndex(msg => msg.id === messageId)
            if (prevMessageIndex !== -1) {
              return prev.map((msg, idx) =>
                idx === prevMessageIndex
                  ? {
                      ...msg,
                      metadata: {
                        ...(msg.metadata || {}),
                        sources: sourcesToAttach
                      }
                    }
                  : msg
              )
            }
            return prev
          })
        }

        streamingSourcesRef.current = null
        pendingSourcesMessageIdRef.current = null
      }
    }
  }, [status, messages, setMessages])

  const resolveToolName = (part: any) => {
    if (typeof part?.toolName === 'string') return part.toolName
    if (typeof part?.type === 'string' && part.type.startsWith('tool-')) {
      return part.type.slice(5)
    }
    return undefined
  }

  const renderToolContent = (part: any): ReactNode => {
    if (!part || typeof part.type !== 'string' || !part.type.startsWith('tool-')) return null

    const toolName = resolveToolName(part)
    const input = typeof part.input === 'object' && part.input !== null ? part.input : undefined
    const output = typeof part.output === 'object' && part.output !== null ? part.output : undefined

    // Handle document generation tool with special UI
    if (toolName === 'createDocument' && output?.success && output?.base64Data) {
      const handleDownload = () => {
        const link = document.createElement('a')
        link.href = output.base64Data
        link.download = output.filename || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      const getIcon = () => {
        switch (output.format) {
          case 'pdf': return '📄'
          case 'excel': return '📊'
          case 'word': return '📝'
          default: return '📄'
        }
      }

      return (
        <div className="bg-muted rounded-lg px-3 sm:px-4 py-3 border border-muted-foreground/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{getIcon()}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{output.filename}</p>
                <p className="text-xs text-muted-foreground">{output.message}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Download
            </button>
          </div>
        </div>
      )
    }

    return (
      <ToolCallCard
        toolName={toolName}
        input={input}
        output={output}
        state={part.state}
        errorText={part.errorText}
      />
    )
  }

  // Load model from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel')
    if (savedModel) {
      setSelectedModel(savedModel)
    }
    window.scrollTo(0, 0)
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }, [])

  const handleModelChange = (model: string) => {
    const clearFiles = () => {
      setAttachedFiles(null)
    }

    if (attachedFiles && attachedFiles.length > 0) {
      const hasDocFiles = Array.from(attachedFiles).some(f => isDocumentFile(f.name))

      if (model === 'deepseek-chat') {
        if (!window.confirm('Deepseek does not support file attachments. Your attached files will be removed. Continue?')) return
        clearFiles()
      } else if (model === 'grok-beta' && hasDocFiles) {
        if (!window.confirm('Grok does not support PDF or document files. Your attached documents will be removed. Continue?')) return
        clearFiles()
      }
    }

    setSelectedModel(model)
    localStorage.setItem('selectedModel', model)
  }

  useEffect(() => {
    setActiveChatId(chatId)
    return () => {
      if (titlePollRef.current) {
        window.clearInterval(titlePollRef.current)
        titlePollRef.current = null
      }
    }
  }, [chatId])

  // Restore draft input
  useEffect(() => {
    const draftKey = `chat-draft-${activeChatId || 'new'}`
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft) {
      setInput(savedDraft)
    } else {
      setInput('')
    }
  }, [activeChatId])

  // Debounced save draft
  useEffect(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current)
    }

    draftTimerRef.current = setTimeout(() => {
      const draftKey = `chat-draft-${activeChatId || 'new'}`
      if (input.trim()) {
        localStorage.setItem(draftKey, input)
      } else {
        localStorage.removeItem(draftKey)
      }
    }, 500)

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current)
      }
    }
  }, [input, activeChatId])

  // Load existing messages
  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') {
      return
    }

    if (!activeChatId || activeChatId.startsWith('temp-chat-')) {
      if (!isCreatingNewChat.current) {
        setMessages([])
      }
      setHasMoreMessages(false)
      return
    }

    if (isCreatingNewChat.current) {
      isCreatingNewChat.current = false
      setHasMoreMessages(false)
      return
    }

    const loadExistingMessages = async () => {
      setIsLoadingMessages(true)

      try {
        const response = await fetch(`/api/chat/${activeChatId}`)
        if (response.ok) {
          const data = await response.json()
          const formattedMessages = data.chat.messages.map((msg: any) => convertServerMessage(msg))
          setMessages(formattedMessages)
          setHasMoreMessages(formattedMessages.length >= 15)
        } else if (response.status === 401) {
          router.push('/login')
        } else {
          setMessages([])
          setHasMoreMessages(false)
        }
      } catch (error) {
        console.error('Error loading chat messages:', error)
        setMessages([])
        setHasMoreMessages(false)
      } finally {
        setIsLoadingMessages(false)
      }
    }
    loadExistingMessages()
  }, [activeChatId, setMessages, router, status])

  const loadMoreMessages = useCallback(async () => {
    if (!activeChatId || activeChatId.startsWith('temp-chat-') || isLoadingMoreMessages || !hasMoreMessages) return

    setIsLoadingMoreMessages(true)
    try {
      const oldestMessage = messages[0]
      const before = oldestMessage && (oldestMessage as any).createdAt
        ? (oldestMessage as any).createdAt.toISOString()
        : undefined

      const response = await fetch(
        `/api/chat/${activeChatId}/messages?limit=15${before ? `&before=${before}` : ''}`
      )

      if (response.ok) {
        const data = await response.json()

        if (data.messages.length > 0) {
          const formattedMessages = data.messages.map((msg: any) => convertServerMessage(msg))
          setMessages(prev => [...formattedMessages, ...prev])
        }

        setHasMoreMessages(data.hasMore && data.messages.length > 0)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMoreMessages(false)
    }
  }, [activeChatId, isLoadingMoreMessages, hasMoreMessages, messages, setMessages])

  // Scroll management
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesAreaRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50

      setIsUserScrolledUp(!isAtBottom)
    }

    const messagesArea = messagesAreaRef.current
    if (messagesArea) {
      messagesArea.addEventListener('scroll', handleScroll)
      return () => messagesArea.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!isUserScrolledUp && !isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, status, isUserScrolledUp, isLoadingMessages])

  useEffect(() => {
    setEditingTitle(chatTitle)
  }, [chatTitle])

  // Live-update sidebar preview
  useEffect(() => {
    if (!activeChatId || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || !lastMessage.parts) return

    const previewText = lastMessage.parts
      .filter((p: any) => p.type === 'text' && typeof (p as any).text === 'string')
      .map((p: any) => (p as any).text)
      .join(' ')
      .slice(0, 50)

    if (!previewText) return

    const timeoutId = setTimeout(() => {
      setChatHistory(prev => {
        const currentChat = prev.find(c => c.id === activeChatId)
        if (currentChat && currentChat.lastMessage === previewText) {
          return prev
        }

        return prev.map(c =>
          c.id === activeChatId
            ? { ...c, lastMessage: previewText, timestamp: 'Just now' }
            : c
        )
      })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [messages, activeChatId])

  const handleTitleClick = () => {
    if (!activeChatId || activeChatId.startsWith('temp-chat-')) return
    setIsEditingTitle(true)
  }

  const handleTitleSave = async () => {
    if (!activeChatId || !editingTitle.trim() || editingTitle === chatTitle) {
      setIsEditingTitle(false)
      setEditingTitle(chatTitle)
      return
    }

    try {
      const response = await fetch(`/api/chat/${activeChatId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() })
      })

      if (response.ok) {
        onTitleUpdate?.(activeChatId, editingTitle.trim())
      } else {
        console.error('Failed to update title')
        setEditingTitle(chatTitle)
      }
    } catch (error) {
      console.error('Error updating title:', error)
      setEditingTitle(chatTitle)
    }

    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setEditingTitle(chatTitle)
  }

  const canEditMessage = (message: any, latestEditableUserMessageId?: string | null) =>
    message?.role === 'user' &&
    Array.isArray(message?.parts) &&
    message.parts.every((part: any) => part.type === 'text') &&
    (isPersistentMessageId(message?.id) ||
      (!!latestEditableUserMessageId && message?.id === latestEditableUserMessageId) ||
      message?.metadata?.editable === true)

  const handleStartEditingMessage = (message: any) => {
    if (!canEditMessage(message, latestEditableUserMessageId) || status !== 'ready') return
    setEditingMessageId(message.id)
    setEditingDraft(extractMessageText(message))
  }

  const handleCancelEditingMessage = () => {
    setEditingMessageId(null)
    setEditingDraft('')
  }

  const handleSaveEditedMessage = async () => {
    if (!editingMessageId || !activeChatId) return
    const trimmedDraft = editingDraft.trim()
    if (!trimmedDraft || status !== 'ready') return

    const targetMessageIndex = messages.findIndex(msg => msg.id === editingMessageId)
    if (targetMessageIndex === -1) {
      setEditingMessageId(null)
      setEditingDraft('')
      return
    }

    const targetMessage = messages[targetMessageIndex]
    const messagesUpToEdit = messages.slice(0, targetMessageIndex + 1)
    setMessages(messagesUpToEdit)

    setIsSavingEdit(true)
    try {
      await fetch(`/api/chat/${activeChatId}/messages?afterMessageId=${editingMessageId}`, {
        method: 'DELETE'
      })

      await sendMessage(
        {
          role: 'user',
          parts: [{ type: 'text', text: trimmedDraft }],
          messageId: editingMessageId,
          metadata: {
            ...(targetMessage.metadata || {}),
            edited: true,
            editedAt: new Date(),
            editable: true,
            createdAt: (targetMessage as any).createdAt || new Date()
          }
        },
        { body: { chatId: activeChatId, selectedModel } }
      )
      setEditingMessageId(null)
      setEditingDraft('')
    } catch (error) {
      console.error('Error submitting edited message:', error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleCopyMessage = async (messageId: string) => {
    const targetMessage = messages.find(msg => msg.id === messageId)
    if (!targetMessage) return
    const text = extractMessageText(targetMessage)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => {
        setCopiedMessageId(prev => (prev === messageId ? null : prev))
      }, 1500)
    } catch (error) {
      console.error('Error copying message:', error)
    }
  }

  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setFeedbackMessages(prev => ({
      ...prev,
      [messageId]: prev[messageId] === feedback ? undefined as any : feedback
    }))
    console.log('Feedback submitted:', { messageId, feedback })
  }

  const handleRegenerateResponse = async () => {
    if (status !== 'ready' || !activeChatId) return

    let lastUserMessageIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i
        break
      }
    }

    if (lastUserMessageIndex === -1) return

    const lastUserMessage = messages[lastUserMessageIndex]
    const messagesUpToUser = messages.slice(0, lastUserMessageIndex + 1)
    setMessages(messagesUpToUser)

    setIsRegenerating(true)
    try {
      if (lastUserMessage.id) {
        await fetch(`/api/chat/${activeChatId}/messages?afterMessageId=${lastUserMessage.id}`, {
          method: 'DELETE'
        })
      }

      const userMessageText = extractMessageText(lastUserMessage)
      if (userMessageText) {
        await sendMessage(
          {
            role: 'user',
            parts: [{ type: 'text', text: userMessageText }],
            messageId: lastUserMessage.id,
            metadata: lastUserMessage.metadata
          },
          { body: { chatId: activeChatId, selectedModel } }
        )
      }
    } catch (error) {
      console.error('Error regenerating response:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const latestEditableUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const candidate = messages[i]
      if (candidate?.role === 'user') {
        return candidate.id
      }
    }
    return null
  }, [messages])

  const handleOpenArtifact = (artifact: Artifact) => {
    setCurrentArtifact(artifact)
    setIsArtifactPanelOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== 'ready') return

    const parts: any[] = []
    if (input.trim()) parts.push({ type: 'text', text: input.trim() })
    if (attachedFiles && attachedFiles.length > 0) {
      const fileParts = await convertFilesToDataURLs(attachedFiles)
      parts.push(...fileParts)
    }

    if (parts.length === 0) return

    if (!activeChatId) {
      const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      try {
        const resp = await fetch('/api/chat/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: newId, title: 'New Chat' })
        })

        if (resp.ok) {
          const data = await resp.json()
          isCreatingNewChat.current = true
          setActiveChatId(newId)
          setCurrentChatId(newId)
          setChatHistory(prev => {
            const exists = prev.some(c => c.id === data.chat.id)
            return exists ? prev : [data.chat, ...prev]
          })
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/chat/${newId}`)
            sessionStorage.setItem('lastActiveChatId', newId)
          }
          sendMessage({ role: 'user', parts, metadata: { editable: true, createdAt: new Date() } }, { body: { chatId: newId, selectedModel } })
        } else if (resp.status === 401) {
          router.push('/login')
          return
        } else {
          // Get error details
          let errorMsg = `Failed to create chat (Status: ${resp.status})`
          let errorData: any = null

          try {
            const responseText = await resp.text()
            try {
              errorData = JSON.parse(responseText)
              errorMsg += ` - ${errorData.error || JSON.stringify(errorData)}`
            } catch {
              errorMsg += ` - ${responseText}`
            }
          } catch (e) {
            errorMsg += ` - Unable to read error response`
          }

          console.error(errorMsg)

          // If chat already exists (409), proceed with sending message
          if (resp.status === 409) {
            console.log('Chat already exists, proceeding with message...')
            setActiveChatId(newId)
            setCurrentChatId(newId)
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/chat/${newId}`)
              sessionStorage.setItem('lastActiveChatId', newId)
            }
            sendMessage({ role: 'user', parts, metadata: { editable: true, createdAt: new Date() } }, { body: { chatId: newId, selectedModel } })
          } else {
            // Show user-friendly error for other failures
            alert(`Unable to create chat. Please try again.\n\nError: ${errorMsg}`)
            return
          }
        }
      } catch (err) {
        console.error('Error creating chat:', err)
        alert(`Network error while creating chat. Please check your connection and try again.\n\nDetails: ${err instanceof Error ? err.message : String(err)}`)
        return
      }
    } else {
      sendMessage({ role: 'user', parts, metadata: { editable: true, createdAt: new Date() } }, { body: { chatId: activeChatId, selectedModel } })
    }
    setInput('')
    localStorage.removeItem(`chat-draft-${activeChatId || 'new'}`)
    setAttachedFiles(null)
    setIsUserScrolledUp(false)
  }

  return (
    <div className="flex flex-col w-full h-screen bg-white dark:bg-black overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3.5 bg-white dark:bg-black">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden h-9 w-9 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>

          {isEditingTitle ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleSave()
                } else if (e.key === 'Escape') {
                  handleTitleCancel()
                }
              }}
              onBlur={handleTitleSave}
              className="text-base font-semibold bg-background border border-input rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring max-w-md"
              autoFocus
            />
          ) : (
            <h1
              className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-md ${
                chatId && !chatId.startsWith('temp-chat-')
                  ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                  : ''
              }`}
              onClick={handleTitleClick}
              title={chatId && !chatId.startsWith('temp-chat-') ? 'Click to edit title' : undefined}
            >
              {chatTitle}
            </h1>
          )}
        </div>

        {chatId && !chatId.startsWith('temp-chat-') && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddToProjectOpen(true)}
              className="h-9 w-9 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Add to project"
            >
              <FolderInput className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Share chat"
                >
                  <Share2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-1">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/chat/${chatId}/share`, { method: 'POST' })
                        if (!response.ok) {
                          if (response.status === 401) {
                            alert('Please log in to share this chat')
                            return
                          }
                          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                          throw new Error(errorData.error || 'Failed to generate share link')
                        }
                        const data = await response.json()
                        await navigator.clipboard.writeText(data.shareUrl)
                        alert('🔗 Link copied to clipboard!')
                      } catch (error) {
                        console.error('Error sharing:', error)
                        alert('Failed to generate share link. Please try again.')
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Link className="h-4 w-4" />
                    <span>Copy link</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/chat/${chatId}/share`, { method: 'POST' })
                        if (!response.ok) throw new Error('Failed to generate share link')
                        const data = await response.json()

                        if (navigator.share) {
                          await navigator.share({
                            title: chatTitle || 'Chat',
                            url: data.shareUrl
                          })
                        } else {
                          alert('Share not supported on this device')
                        }
                      } catch (error: any) {
                        if (error?.name !== 'AbortError') {
                          console.error('Error sharing:', error)
                        }
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share via...</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/chat/${chatId}/share`, { method: 'POST' })
                        if (!response.ok) throw new Error('Failed to generate share link')
                        const data = await response.json()

                        const subject = encodeURIComponent(`Check out this chat: ${chatTitle || 'Chat'}`)
                        const body = encodeURIComponent(`I wanted to share this chat with you:\n\n${data.shareUrl}\n\nNote: You'll need to be logged in to view it.`)
                        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
                      } catch (error) {
                        console.error('Error sharing:', error)
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Share via email</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/chat/${chatId}/share`, { method: 'POST' })
                        if (!response.ok) throw new Error('Failed to generate share link')
                        const data = await response.json()

                        const text = encodeURIComponent(`Check out this chat: ${data.shareUrl}`)
                        window.open(`https://wa.me/?text=${text}`, '_blank')
                      } catch (error) {
                        console.error('Error sharing:', error)
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Share via WhatsApp</span>
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">
                    Recipients must be logged in to view
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Token Limit Modal */}
      <Dialog open={!!tokenLimitError} onOpenChange={() => setTokenLimitError(null)}>
        <DialogContent className="sm:max-w-md max-w-[90vw] !top-[10%] !translate-y-0 !left-1/2 !-translate-x-1/2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Daily Token Limit Reached
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p className="text-sm text-foreground">
                {tokenLimitError?.message || 'You have reached your daily token limit.'}
              </p>

              {tokenLimitError?.resetAt && (
                <p className="text-xs text-muted-foreground">
                  Your daily limit will reset at{' '}
                  {new Date(tokenLimitError.resetAt).toLocaleTimeString()}.
                </p>
              )}

              <div className="pt-2 pb-1">
                <p className="text-sm text-foreground">
                  Upgrade to a higher plan to continue chatting with increased token limits.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setTokenLimitError(null)}
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                setTokenLimitError(null)
                router.push('/settings?tab=billing&view=plans')
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages Area */}
      <div
        ref={messagesAreaRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-black"
      >
        {isLoadingMessages && messages.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 pointer-events-none transition-opacity duration-200" />
        )}

        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Load More Messages Button */}
          {!isLoadingMessages && hasMoreMessages && !isLoadingMoreMessages && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <button
                onClick={loadMoreMessages}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors underline hover:no-underline"
              >
                Load older messages
              </button>
            </div>
          )}

          {/* Loading More Messages Indicator */}
          {isLoadingMoreMessages && (
            <div className="flex gap-3 justify-center py-2">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Loading older messages...</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Messages */}
          {isLoadingMessages && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-500 dark:bg-gray-400/20 flex items-center justify-center flex-shrink-0">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
              <div className="bg-gray-500 dark:bg-gray-400/10 rounded-lg px-4 py-2 max-w-3xl">
                <p>Loading conversation...</p>
              </div>
            </div>
          )}

          {/* Welcome Message */}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 300px)' }}>
              <div className="max-w-3xl text-center px-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 dark:text-gray-100 mb-4">
                  How can I help you today?
                </h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                  Start a conversation or ask me anything
                </p>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((message, messageIndex) => {
            const isAssistant = message.role === 'assistant'
            const isUser = message.role === 'user'
            const isLastMessage = messageIndex === messages.length - 1
            const isStreamingThisMessage = isLastMessage && (status === 'submitted' || status === 'streaming')
            const isEditingUserMessage = editingMessageId === message.id

            const currentMessageDate = (message as any).createdAt ? new Date((message as any).createdAt) : null
            const previousMessage = messageIndex > 0 ? messages[messageIndex - 1] : null
            const previousMessageDate = previousMessage && (previousMessage as any).createdAt ? new Date((previousMessage as any).createdAt) : null

            const shouldShowDateSeparator = currentMessageDate && (
              !previousMessageDate || !isSameDay(currentMessageDate, previousMessageDate)
            )

            const metadata = (message as any).metadata || {}
            const isEditableMessage = canEditMessage(message, latestEditableUserMessageId)

            return (
              <React.Fragment key={message.id}>
                {/* Date Separator */}
                {shouldShowDateSeparator && currentMessageDate && (
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {formatDateSeparator(currentMessageDate)}
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''} ${isEditingUserMessage ? 'items-stretch' : 'items-start'} group`}
                >
                  {/* Avatar */}
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {isUser ? getUserInitial(session?.user?.email) : 'AI'}
                    </span>
                  </div>

                  <div className={`flex flex-col gap-1 min-w-0 ${isEditingUserMessage ? 'flex-1' : 'flex-1'}`}>
                    {/* Editing UI for User Messages */}
                    {isEditingUserMessage ? (
                      <div className="space-y-3 text-gray-900">
                        <div className="rounded-xl border border-blue-200 bg-blue-100/70 p-1 shadow-sm">
                          <textarea
                            value={editingDraft}
                            onChange={e => setEditingDraft(e.target.value)}
                            rows={3}
                            className="w-full min-h-[120px] rounded-lg border border-blue-300 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 p-3 text-sm leading-relaxed"
                          />
                        </div>
                        <div className="flex justify-end gap-3 text-xs font-semibold uppercase tracking-widest">
                          <button
                            type="button"
                            onClick={handleCancelEditingMessage}
                            className="text-gray-800 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditedMessage}
                            disabled={isSavingEdit || !editingDraft.trim()}
                            className="rounded-full bg-white text-blue-600 px-4 py-1.5 shadow-sm transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingEdit ? 'Saving...' : 'Save & Retry'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thinking Indicator - Show while tools are executing */}
                        {isAssistant && isStreamingThisMessage && message.parts?.some((p: any) =>
                          typeof p.type === 'string' && p.type.startsWith('tool-') && !p.output
                        ) && (
                          <div className="mb-2">
                            <ThinkingIndicator stage="searching" />
                          </div>
                        )}

                        {/* Message Content */}
                        <MessageItem
                          message={message}
                          isUser={isUser}
                          isAssistant={isAssistant}
                          isStreaming={isStreamingThisMessage}
                          userEmail={session?.user?.email}
                          onOpenArtifact={handleOpenArtifact}
                          renderToolContent={renderToolContent}
                        />

                        {/* Message Actions */}
                        {!isEditingUserMessage && (
                          <MessageActions
                            message={message}
                            isUser={isUser}
                            isAssistant={isAssistant}
                            isLastMessage={isLastMessage}
                            isStreamingThisMessage={isStreamingThisMessage}
                            isEditableMessage={isEditableMessage}
                            editingMessageId={editingMessageId}
                            copiedMessageId={copiedMessageId}
                            openSourcesPopoverId={openSourcesPopoverId}
                            feedbackMessages={feedbackMessages}
                            isRegenerating={isRegenerating}
                            status={status}
                            onCopy={handleCopyMessage}
                            onEdit={handleStartEditingMessage}
                            onRegenerate={handleRegenerateResponse}
                            onFeedback={handleFeedback}
                            onSourcesOpen={setOpenSourcesPopoverId}
                            extractSourcesFromMessage={extractSourcesFromMessage}
                            formatMessageTime={formatMessageTime}
                            formatEditedLabel={formatEditedLabel}
                          />
                        )}

                        {/* Show EDITED label when buttons are hidden */}
                        {isUser && !isEditingUserMessage && !isEditableMessage && metadata?.edited && (
                          <div className={`flex px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[11px] uppercase tracking-wide text-gray-600 dark:text-gray-400">
                              {formatEditedLabel(metadata?.editedAt)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )
          })}

          {/* Loading Indicator - Only show when no assistant message exists yet */}
          {(status === 'submitted' || status === 'streaming') && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
              </div>
              <div className="bg-muted rounded-lg px-4 py-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  {status === 'submitted' ? (
                    <>
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">MW is typing...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Using ChatInput Component */}
      <ChatInput
        input={input}
        setInput={setInput}
        attachedFiles={attachedFiles}
        setAttachedFiles={setAttachedFiles}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        status={status}
        onSubmit={handleSubmit}
        onStop={stop}
        acceptedFileTypes={getAcceptedFileTypes(selectedModel)}
        attachTooltip={getAttachTooltip(selectedModel)}
        canAttach={selectedModel !== 'deepseek-chat'}
      />

      {/* Modals */}
      {activeChatId && !activeChatId.startsWith('temp-chat-') && (
        <AddToProjectModal
          open={isAddToProjectOpen}
          onOpenChange={setIsAddToProjectOpen}
          chatId={activeChatId}
          onSuccess={() => {}}
        />
      )}

      <ArtifactPanel
        isOpen={isArtifactPanelOpen}
        onClose={() => setIsArtifactPanelOpen(false)}
        artifact={currentArtifact}
      />
    </div>
  )
}
