import Chat from '@/models/Chat'
import Message from '@/models/Message'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  edited?: boolean
  editedAt?: Date | null
}

const isMongoId = (value?: string): boolean =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)

const formatStoredMessage = (msg: any): ChatMessage & { id: string; sources?: any[] } => ({
  id: msg._id.toString(),
  role: msg.role,
  content: msg.content,
  timestamp: msg.timestamp,
  edited: Boolean(msg.edited),
  editedAt: msg.edited_at || null,
  sources: msg.sources || []
})

export async function saveUserMessage(
  chatId: string, 
  userId: string, 
  content: string,
  messageId?: string
): Promise<void> {
  console.log('💾 [SAVE] Attempting to save user message:', { chatId, userId, content })
  try {
    // Ensure chat exists first
    await Chat.findOneAndUpdate(
      { chat_id: chatId, user_id: userId },
      { $set: { updated_at: new Date() } },
      { upsert: true, new: true }
    )

    if (messageId) {
      if (isMongoId(messageId)) {
        const updated = await Message.findOneAndUpdate(
          { _id: messageId, chat_id: chatId, user_id: userId, role: 'user' },
          { $set: { content, edited: true, edited_at: new Date() } },
          { new: true }
        )

        if (updated) {
          console.log('[SAVE] User message updated successfully:', { chatId, messageId })
          return
        }

        console.warn('[SAVE] Could not find message to update with provided id, trying latest user message fallback:', { chatId, messageId })
      }

      const latestUpdated = await Message.findOneAndUpdate(
        { chat_id: chatId, user_id: userId, role: 'user' },
        { $set: { content, edited: true, edited_at: new Date() } },
        { sort: { timestamp: -1 }, new: true }
      )

      if (latestUpdated) {
        console.log('[SAVE] Updated latest user message via fallback:', { chatId, fallbackId: latestUpdated._id.toString() })
        return
      }
    }

    // Save message to separate Message collection
    const message = new Message({
      chat_id: chatId,
      user_id: userId,
      role: 'user',
      content,
      timestamp: new Date()
    })

    await message.save()
    
    console.log('[SAVE] User message saved successfully:', { chatId, messageId: message._id })
  } catch (error) {
    console.error('[SAVE] Error saving user message:', error)
    throw error
  }
}

export async function saveAssistantMessage(
  chatId: string,
  userId: string,
  content: string,
  sources?: Array<{ title: string; url?: string; snippet?: string; source?: string }>
): Promise<void> {
  console.log('💾 [SAVE] Attempting to save assistant message:', { chatId, userId, contentLength: content.length, sourcesCount: sources?.length || 0 })
  try {
    // Update chat's updated_at timestamp
    await Chat.findOneAndUpdate(
      { chat_id: chatId, user_id: userId },
      { $set: { updated_at: new Date() } }
    )

    // Convert sources to the format expected by the Message schema
    const messageSources = sources?.map(s => ({
      document_name: s.title && s.title.trim() ? s.title.trim() : undefined,
      document_url: s.url && s.url.trim() ? s.url.trim() : undefined,
      text_snippet: s.snippet && s.snippet.trim() ? s.snippet.trim() : undefined,
      similarity: 0
    })).filter(s => s.document_name || s.document_url || s.text_snippet) || []

    // Save message to separate Message collection
    const message = new Message({
      chat_id: chatId,
      user_id: userId,
      role: 'assistant',
      content,
      sources: messageSources,
      timestamp: new Date()
    })

    await message.save()

    console.log('[SAVE] Assistant message saved successfully:', { chatId, messageId: message._id, sourcesCount: messageSources.length })
  } catch (error) {
    console.error('[SAVE] Error saving assistant message:', error)
    throw error
  }
}

export async function updateChatTitle(
  chatId: string,
  userId: string,
  firstUserMessage: string
): Promise<void> {
  console.log('[TITLE] Attempting to update chat title:', { chatId, userId, firstUserMessage })
  try {
    if (!firstUserMessage || typeof firstUserMessage !== 'string') {
      console.log('[TITLE] Invalid message content, skipping title update')
      return
    }

    const chat = await Chat.findOne({ chat_id: chatId, user_id: userId })
    
    if (chat && chat.title === 'New Chat') {
      // Generate title from first few words of the message
      const words = firstUserMessage.trim().split(/\s+/)
      const titleWords = words.slice(0, 5) // Take first 5 words
      let title = titleWords.join(' ')
      
      // If title is too long or we took all words but it's long, truncate
      if (title.length > 40) {
        title = title.substring(0, 37) + '...'
      } else if (words.length > 5) {
        // If there are more words, add ellipsis
        title = title + '...'
      }
      
      // Fallback if title is empty or too short
      if (title.length < 3) {
        title = 'New Chat'
      }
      
      await Chat.findOneAndUpdate(
        { chat_id: chatId, user_id: userId },
        { $set: { title } }
      )
      
      console.log('[TITLE] Chat title updated successfully:', { chatId, title, originalMessage: firstUserMessage })
    } else {
      console.log('[TITLE] No title update needed (chat not found or title already set)')
    }
  } catch (error) {
    console.error('[TITLE] Error updating chat title:', error)
    // Don't throw - this shouldn't break the whole chat flow
  }
}

export function getLastUserMessage(messages: any[]): any | null {
  return messages.filter(m => m.role === 'user').pop() || null
}

export async function getMessages(
  chatId: string,
  userId: string,
  limit?: number,
  before?: Date
): Promise<any[]> {
  console.log('📖 [LOAD] Loading messages:', { chatId, userId, limit, before })
  try {
    const query: any = { chat_id: chatId, user_id: userId }
    
    if (before) {
      query.timestamp = { $lt: before }
    }

    let queryBuilder = Message.find(query).sort({ timestamp: -1 })
    
    // Only apply limit if specified (allows fetching all messages when limit is undefined)
    if (limit !== undefined && limit > 0) {
      queryBuilder = queryBuilder.limit(limit)
    }
    
    const messages = await queryBuilder.lean()

    // Reverse to get chronological order (oldest first)
    const chronologicalMessages = messages.reverse()

    console.log('[LOAD] Messages loaded successfully:', { chatId, count: chronologicalMessages.length })
    
    return chronologicalMessages.map((msg: any) => formatStoredMessage(msg))
  } catch (error) {
    console.error('[LOAD] Error loading messages:', error)
    throw error
  }
}

export async function getLatestMessages(
  chatId: string,
  userId: string,
  limit?: number
): Promise<any[]> {
  return getMessages(chatId, userId, limit)
}

/**
 * Delete all messages after a specific message ID (used when editing messages)
 * This removes all messages that come after the edited message in the conversation
 */
export async function deleteMessagesAfter(
  chatId: string,
  userId: string,
  messageId: string
): Promise<number> {
  console.log('[DELETE] Deleting messages after:', { chatId, userId, messageId })
  try {
    if (!isMongoId(messageId)) {
      console.log('[DELETE] Invalid message ID (not a MongoDB ID), skipping deletion')
      return 0
    }

    // Find the timestamp of the target message
    const targetMessage = await Message.findOne({
      _id: messageId,
      chat_id: chatId,
      user_id: userId
    })

    if (!targetMessage) {
      console.warn('[DELETE] Target message not found:', { messageId })
      return 0
    }

    // Delete all messages with timestamp greater than the target message
    const result = await Message.deleteMany({
      chat_id: chatId,
      user_id: userId,
      timestamp: { $gt: targetMessage.timestamp }
    })

    console.log('[DELETE] Messages deleted successfully:', {
      chatId,
      deletedCount: result.deletedCount,
      afterMessageId: messageId
    })

    return result.deletedCount || 0
  } catch (error) {
    console.error('[DELETE] Error deleting messages:', error)
    throw error
  }
}
