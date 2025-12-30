export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export class ChatStorage {
  private static STORAGE_KEY = 'ai-chat-app-chats'

  // Get all chats
  static getAllChats(): Chat[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading chats:', error)
      return []
    }
  }

  // Get a specific chat by ID
  static getChatById(chatId: string): Chat | null {
    const chats = this.getAllChats()
    return chats.find(chat => chat.id === chatId) || null
  }

  // Create a new chat
  static createChat(chatId: string, title: string = 'New Chat'): Chat {
    const newChat: Chat = {
      id: chatId,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const chats = this.getAllChats()
    const updatedChats = [newChat, ...chats]
    this.saveChats(updatedChats)
    
    return newChat
  }

  // Add a message to a chat
  static addMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const chats = this.getAllChats()
    const chatIndex = chats.findIndex(chat => chat.id === chatId)
    
    const newMessage: ChatMessage = {
      id: this.generateMessageId(),
      ...message,
      timestamp: new Date().toISOString()
    }

    if (chatIndex >= 0) {
      chats[chatIndex].messages.push(newMessage)
      chats[chatIndex].updatedAt = new Date().toISOString()
      
      // Auto-update chat title based on first user message
      if (chats[chatIndex].title === 'New Chat' && message.role === 'user') {
        chats[chatIndex].title = this.generateChatTitle(message.content)
      }
    } else {
      // Create chat if it doesn't exist
      const newChat = this.createChat(chatId)
      newChat.messages.push(newMessage)
      chats.unshift(newChat)
    }

    this.saveChats(chats)
    return newMessage
  }

  // Get messages for a specific chat
  static getChatMessages(chatId: string): ChatMessage[] {
    const chat = this.getChatById(chatId)
    return chat ? chat.messages : []
  }

  // Update chat title
  static updateChatTitle(chatId: string, title: string): void {
    const chats = this.getAllChats()
    const chatIndex = chats.findIndex(chat => chat.id === chatId)
    
    if (chatIndex >= 0) {
      chats[chatIndex].title = title
      chats[chatIndex].updatedAt = new Date().toISOString()
      this.saveChats(chats)
    }
  }

  // Delete a chat
  static deleteChat(chatId: string): void {
    const chats = this.getAllChats()
    const filteredChats = chats.filter(chat => chat.id !== chatId)
    this.saveChats(filteredChats)
  }

  // Get last message preview for sidebar
  static getLastMessagePreview(chatId: string): string {
    const messages = this.getChatMessages(chatId)
    if (messages.length === 0) return 'No messages yet'
    
    const lastMessage = messages[messages.length - 1]
    const preview = lastMessage.content.substring(0, 50)
    return preview.length < lastMessage.content.length ? preview + '...' : preview
  }

  // Get formatted timestamp for display
  static getFormattedTimestamp(chatId: string): string {
    const chat = this.getChatById(chatId)
    if (!chat) return 'Unknown'

    const updatedAt = new Date(chat.updatedAt)
    const now = new Date()
    const diffMs = now.getTime() - updatedAt.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return updatedAt.toLocaleDateString()
  }

  // Private helper methods
  private static saveChats(chats: Chat[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats))
    } catch (error) {
      console.error('Error saving chats:', error)
    }
  }

  private static generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  private static generateChatTitle(firstMessage: string): string {
    // Create a title from the first few words of the first message
    const words = firstMessage.trim().split(/\s+/).slice(0, 4)
    let title = words.join(' ')
    
    if (title.length > 30) {
      title = title.substring(0, 27) + '...'
    }
    
    return title || 'New Chat'
  }
} 