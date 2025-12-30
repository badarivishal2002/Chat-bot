"use client"

import { createContext, useContext } from 'react'

export interface ChatHistoryItem {
  id: string
  title: string
  timestamp: string
  lastMessage?: string
  messageCount?: number
}

interface ChatLayoutContextValue {
  chatHistory: ChatHistoryItem[]
  currentChatId?: string
  setCurrentChatId: (id: string | undefined) => void
  setChatHistory: (updater: (prev: ChatHistoryItem[]) => ChatHistoryItem[]) => void
  isLoadingHistory: boolean
  loadChatHistory: (forceRefresh?: boolean) => Promise<void>
}

const ChatLayoutContext = createContext<ChatLayoutContextValue | null>(null)

export function useChatLayout() {
  const ctx = useContext(ChatLayoutContext)
  if (!ctx) throw new Error('useChatLayout must be used within ChatLayoutProvider')
  return ctx
}

export function ChatLayoutProvider({ value, children }: { value: ChatLayoutContextValue; children: React.ReactNode }) {
  return <ChatLayoutContext.Provider value={value}>{children}</ChatLayoutContext.Provider>
}

