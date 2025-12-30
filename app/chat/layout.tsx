"use client"

import { useState, useCallback } from 'react'
import { ChatLayoutProvider, type ChatHistoryItem } from '@/lib/chat-layout-context'

const CHAT_HISTORY_CACHE_KEY = 'chat_app_chat_history_cache'
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

export default function ChatSectionLayout({ children }: { children: React.ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined)
  const [chatHistory, setChatHistoryState] = useState<ChatHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const setChatHistory = (updater: (prev: ChatHistoryItem[]) => ChatHistoryItem[]) => {
    setChatHistoryState(prev => {
      const updated = updater(prev)
      // Update cache whenever history changes
      localStorage.setItem(CHAT_HISTORY_CACHE_KEY, JSON.stringify({
        data: updated,
        timestamp: Date.now()
      }))
      return updated
    })
  }

  const loadChatHistory = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasLoadedOnce) return
    
    setIsLoadingHistory(true)
    
    try {
      // Try to load from cache first for instant display
      if (!forceRefresh) {
        const cached = localStorage.getItem(CHAT_HISTORY_CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const age = Date.now() - timestamp
          
          if (age < CACHE_EXPIRY_MS) {
            setChatHistoryState(data)
            setHasLoadedOnce(true)
            setIsLoadingHistory(false)
            
            // Still fetch in background to update (silently handle errors)
            fetchAndCacheHistory().catch(() => {
              // Silently ignore background fetch errors
            })
            return
          }
        }
      }
      
      // Fetch from API
      await fetchAndCacheHistory()
    } catch (e) {
      // Ignore abort errors, only log other errors
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Failed to load chat history:', e)
      }
    } finally {
      setIsLoadingHistory(false)
      setHasLoadedOnce(true)
    }
  }, [hasLoadedOnce])

  const fetchAndCacheHistory = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const res = await fetch('/api/chat/history', {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const formatted = (data.chats || []).map((chat: any) => ({
          ...chat,
          preview: chat.lastMessage ? chat.lastMessage.substring(0, 50) + (chat.lastMessage.length > 50 ? '...' : '') : undefined,
        }))
        
        setChatHistoryState(formatted)
        
        // Cache the data
        localStorage.setItem(CHAT_HISTORY_CACHE_KEY, JSON.stringify({
          data: formatted,
          timestamp: Date.now()
        }))
      }
    } catch (e) {
      // Silently ignore abort errors, log other errors
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Error fetching chat history:', e)
      }
      // Don't throw - let caller handle errors
      throw e
    }
  }

  return (
    <ChatLayoutProvider
      value={{ chatHistory, currentChatId, setCurrentChatId, setChatHistory, isLoadingHistory, loadChatHistory }}
    >
      {children}
    </ChatLayoutProvider>
  )
}

