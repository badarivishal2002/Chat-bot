"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { chatHistory, currentChatId, setCurrentChatId, setChatHistory, isLoadingHistory, loadChatHistory } = useChatLayout()
  // Sidebar always open on desktop, collapsed on mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Check if we should open sidebar (e.g., coming from discover page)
  // Also load chat history on desktop by default
  useEffect(() => {
    if (searchParams.get('sidebar') === 'open') {
      setIsSidebarCollapsed(false)
      loadChatHistory()
    } else if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      // On desktop, preload chat history since sidebar is visible by default
      loadChatHistory()
    }
  }, [searchParams, loadChatHistory])

  // Restore last active chat from sessionStorage (persists during browser session only)
  useEffect(() => {
    if (!currentChatId && typeof window !== 'undefined') {
      const lastChatId = sessionStorage.getItem('lastActiveChatId')
      if (lastChatId && lastChatId !== 'undefined' && lastChatId.trim() !== '') {
        // Redirect to the last active chat
        router.push(`/chat/${lastChatId}`)
      }
    }
  }, [currentChatId, router])

  const handleNewChat = () => {
    // Do not create a chat record yet. Stay at /chat until first message is sent.
    setCurrentChatId(undefined)
    // Clear session storage when starting a new chat
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastActiveChatId')
    }
    // Navigate to /chat for new chat
    router.push('/chat')
  }

  const handleChatUpdate = () => {
    // This function is now unused - title updates are handled directly in ChatInterface
    // Kept for potential future use, but no longer triggers sidebar refresh
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
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
        if (currentChatId === chatId) {
          setCurrentChatId(undefined)
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

  const handleFilesUploaded = () => {
    // Could trigger refresh of any file-related UI if needed
    console.log('Files uploaded from chat page sidebar')
  }

  const handleUpdateChatTitle = (chatId: string, newTitle: string) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    )
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
          onChatUpdate={handleChatUpdate}
          onTitleUpdate={handleUpdateChatTitle}
          onToggleSidebar={handleToggleCollapse}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
