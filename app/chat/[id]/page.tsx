"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ChatInterface } from '@/components/chat-interface'
import { useChatLayout } from '@/lib/chat-layout-context'

interface ChatHistoryItem {
  id: string
  title: string
  timestamp: string
  lastMessage?: string
  messageCount?: number
}

export default function ChatPageById() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { chatHistory, currentChatId, setCurrentChatId, setChatHistory, isLoadingHistory, loadChatHistory } = useChatLayout()
  // Sidebar always open on desktop, collapsed on mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (params?.id) {
      setCurrentChatId(params.id)
      // Save to sessionStorage for restoring during this browser session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastActiveChatId', params.id)
      }
    }
  }, [params, setCurrentChatId])

  // Load chat history on desktop by default since sidebar is visible
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      loadChatHistory()
    }
  }, [loadChatHistory])

  const generateChatId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // history is provided by layout provider now

  const handleNewChat = () => {
    setCurrentChatId(undefined)
    // Clear session storage when starting a new chat
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastActiveChatId')
    }
    // Keep sidebar open
    router.push('/chat')
  }

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    // Save to sessionStorage for restoring during this browser session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastActiveChatId', chatId)
    }
    // Keep sidebar open when switching chats
    router.push(`/chat/${chatId}`)
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' })
      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
        if (currentChatId === chatId) {
          setCurrentChatId(undefined)
          router.push('/chat')
        }
      } else {
        console.error('Failed to delete chat')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const handleToggleCollapse = () => {
    const willOpen = isSidebarCollapsed
    setIsSidebarCollapsed(!isSidebarCollapsed)
    
    // Load chat history when opening sidebar
    if (willOpen) {
      loadChatHistory()
    }
  }
  const handleFilesUploaded = () => {}
  const handleUpdateChatTitle = (chatId: string, newTitle: string) => {
    setChatHistory(prev => prev.map(chat => (chat.id === chatId ? { ...chat, title: newTitle } : chat)))
  }

  return (
    <div className="flex bg-white dark:bg-black relative overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* Mobile backdrop overlay */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleToggleCollapse}
        />
      )}

      {/* Sidebar - slides in from left on mobile when open */}
      <div
        className={`
          fixed md:relative
          md:flex
          z-[120] md:z-auto
          transition-transform duration-300 ease-in-out
          ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          h-full
          left-0 top-0
          will-change-transform
        `}
        style={{ height: '100dvh' }}
      >
        <Sidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onFilesUploaded={handleFilesUploaded}
          currentChatId={currentChatId}
          isLoadingHistory={isLoadingHistory}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <ChatInterface
          chatId={currentChatId}
          chatTitle={chatHistory.find(chat => chat.id === currentChatId)?.title || 'New Chat'}
          onChatUpdate={() => {}}
          onTitleUpdate={handleUpdateChatTitle}
          onToggleSidebar={handleToggleCollapse}
        />
      </div>
    </div>
  )
}

