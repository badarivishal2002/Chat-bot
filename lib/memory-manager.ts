import { getMem0Client } from "./mem0-client";

/**
 * Memory Manager for Chat History
 *
 * Provides high-level functions for storing and retrieving conversation memories
 * using Mem0. Includes rich temporal metadata for "when did I ask" queries.
 */

export interface MemoryMetadata {
  timestamp: string; // ISO 8601 format
  chat_id: string;
  user_id: string;
  message_type: "user" | "assistant" | "system";
  human_readable_time?: string; // e.g., "January 15, 2025 at 2:30 PM"
  timezone?: string;
}

export interface ChatMemory {
  content: string;
  metadata: MemoryMetadata;
}

export interface MemorySearchResult {
  memory: string;
  metadata: MemoryMetadata;
  relevance_score?: number;
}

/**
 * Add a message to Mem0 memory
 *
 * @param userId - User ID (used as agent_id in Mem0)
 * @param message - Message content
 * @param metadata - Rich metadata including timestamps
 * @returns Promise with Mem0 response
 */
export async function addMemory(
  userId: string,
  message: string,
  metadata: Omit<MemoryMetadata, "human_readable_time">
): Promise<any> {
  try {
    const mem0 = getMem0Client();

    // Add human-readable timestamp
    const date = new Date(metadata.timestamp);
    const humanReadableTime = date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const enrichedMetadata: MemoryMetadata = {
      ...metadata,
      human_readable_time: humanReadableTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Add memory to Mem0 with user_id as agent_id for user-scoped memories
    // Mem0 expects messages as an array
    // Map message_type to valid Mem0 role (user or assistant only)
    const role = metadata.message_type === 'system' ? 'assistant' : metadata.message_type;

    const result = await mem0.add(
      [{ role, content: message }],
      {
        user_id: userId,
        metadata: enrichedMetadata,
      }
    );

    console.log(`[Mem0] Memory added for user ${userId}:`, result);
    return result;
  } catch (error) {
    console.error("[Mem0] Error adding memory:", error);
    throw error;
  }
}

/**
 * Search memories by semantic similarity
 *
 * @param userId - User ID to scope the search
 * @param query - Search query (semantic search)
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with array of relevant memories
 */
export async function searchMemories(
  userId: string,
  query: string,
  limit: number = 10
): Promise<MemorySearchResult[]> {
  try {
    const mem0 = getMem0Client();

    // Search memories for this user
    const results = await mem0.search(query, {
      user_id: userId,
      limit,
    });

    console.log(`[Mem0] Found ${results.length} memories for query:`, query);
    return results.map((result: any) => ({
      memory: result.memory || result.text || result.content,
      metadata: result.metadata,
      relevance_score: result.score,
    }));
  } catch (error) {
    console.error("[Mem0] Error searching memories:", error);
    throw error;
  }
}

/**
 * Search memories with date range filter
 *
 * @param userId - User ID to scope the search
 * @param query - Search query
 * @param dateRange - Optional date range { start: ISO string, end: ISO string }
 * @param limit - Maximum number of results
 * @returns Promise with filtered memories
 */
export async function searchMemoriesWithDateRange(
  userId: string,
  query: string,
  dateRange?: { start?: string; end?: string },
  limit: number = 10
): Promise<MemorySearchResult[]> {
  try {
    // First, get all relevant memories
    const allResults = await searchMemories(userId, query, limit * 2);

    // If no date range specified, return all results
    if (!dateRange?.start && !dateRange?.end) {
      return allResults.slice(0, limit);
    }

    // Filter by date range
    const filteredResults = allResults.filter((result) => {
      const timestamp = new Date(result.metadata.timestamp);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;

      if (start && timestamp < start) return false;
      if (end && timestamp > end) return false;

      return true;
    });

    return filteredResults.slice(0, limit);
  } catch (error) {
    console.error("[Mem0] Error searching with date range:", error);
    throw error;
  }
}

/**
 * Get all memories for a specific chat
 *
 * @param userId - User ID
 * @param chatId - Chat ID to filter by
 * @returns Promise with chat-specific memories
 */
export async function getMemoriesByChatId(
  userId: string,
  chatId: string
): Promise<MemorySearchResult[]> {
  try {
    const mem0 = getMem0Client();

    // Get all memories for this user
    const allMemories = await mem0.getAll({
      user_id: userId,
    });

    // Filter by chat_id
    const chatMemories = allMemories.filter(
      (memory: any) => memory.metadata?.chat_id === chatId
    );

    console.log(`[Mem0] Found ${chatMemories.length} memories for chat ${chatId}`);

    return chatMemories.map((result: any) => ({
      memory: result.memory || result.text || result.content,
      metadata: result.metadata,
    }));
  } catch (error) {
    console.error("[Mem0] Error getting memories by chat ID:", error);
    throw error;
  }
}

/**
 * Format memory results for AI context
 *
 * @param memories - Array of memory search results
 * @returns Formatted string for AI prompt
 */
export function formatMemoriesForAI(memories: MemorySearchResult[]): string {
  if (memories.length === 0) {
    return "No relevant memories found.";
  }

  return memories
    .map((memory, index) => {
      const { metadata } = memory;
      const timeInfo = metadata.human_readable_time || metadata.timestamp;

      return `[Memory ${index + 1}] (${timeInfo})
Role: ${metadata.message_type}
Chat ID: ${metadata.chat_id}
Content: ${memory.memory}
---`;
    })
    .join("\n\n");
}
