'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  role: string
  content: string
  timestamp: string
  sources?: any[]
}

interface SharedChat {
  id: string
  title: string
  created_at: string
  sharedBy: string
  messages: Message[]
}

export default function SharedChatPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [chat, setChat] = useState<SharedChat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/login?callbackUrl=/chat/shared/${params.shareToken}`)
      return
    }

    loadSharedChat()
  }, [session, status, params.shareToken])

  const loadSharedChat = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chat/shared/${params.shareToken}`)

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/login?callbackUrl=/chat/shared/${params.shareToken}`)
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load shared chat')
      }

      const data = await response.json()
      setChat(data.chat)
    } catch (err: any) {
      setError(err.message || 'Failed to load shared chat')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unable to Load Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to My Chats
          </button>
        </div>
      </div>
    )
  }

  if (!chat) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {chat.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shared chat (read-only)
            </p>
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to My Chats
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {chat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {message.role === 'user' ? 'U' : 'AI'}
                </span>
              </div>
              <div
                className={`flex-1 rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-400 text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
