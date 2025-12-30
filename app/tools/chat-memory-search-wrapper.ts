import { ToolContext, ToolDefinition } from './types'
import { chatMemorySearchTool } from './chat-memory-search'

/**
 * Chat Memory Search Tool Wrapper
 *
 * Wraps the chat memory search tool with context from the chat route
 */

export function createChatMemorySearchTool(context: ToolContext): ToolDefinition {
  // Set global user ID for the tool to access
  // @ts-ignore
  globalThis.__currentUserId = context.session.user?.id

  return {
    name: 'chatMemorySearch',
    description: chatMemorySearchTool.description,
    tool: chatMemorySearchTool,
  }
}
