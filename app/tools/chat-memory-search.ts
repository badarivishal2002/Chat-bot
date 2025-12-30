import { jsonSchema } from "ai";
import {
  searchMemories,
  searchMemoriesWithDateRange,
  formatMemoriesForAI,
} from "@/lib/memory-manager";

/**
 * Chat Memory Search Tool
 *
 * Enables the AI to search through past conversations to answer questions like:
 * - "What time did I ask about the chat app?"
 * - "When did we discuss pricing?"
 * - "What did you tell me about MongoDB yesterday?"
 */

export const chatMemorySearchTool = {
  description: `Search through the user's past conversations and chat history. Use this tool when the user asks about:
- Previous questions they asked ("when did I ask about...", "what time did I mention...")
- Past responses you gave ("what did you tell me about...", "did we discuss...")
- Conversations from specific time periods ("yesterday", "last week", "in January")
- Any self-referential queries about the chat history

This tool searches semantically, so it understands meaning, not just exact keywords.`,

  inputSchema: jsonSchema({
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The search query. Should capture the semantic meaning of what to search for (e.g., 'chat app', 'pricing discussion', 'MongoDB setup')",
      },
      dateRange: {
        type: "object",
        properties: {
          start: {
            type: "string",
            description:
              "Start date in ISO format (e.g., '2025-01-01T00:00:00Z')",
          },
          end: {
            type: "string",
            description:
              "End date in ISO format (e.g., '2025-01-31T23:59:59Z')",
          },
        },
        description:
          "Optional date range to filter results. Useful for queries like 'yesterday', 'last week', 'in January'",
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 20,
        default: 5,
        description: "Maximum number of memories to return (default: 5)",
      },
    },
    required: ["query"],
    additionalProperties: false,
  }),

  execute: async (args: {
    query: string;
    dateRange?: { start?: string; end?: string };
    limit?: number;
  }) => {
    const { query, dateRange, limit = 5 } = args;
    console.log(
      `[chatMemorySearch] Executing search for query: "${query}"`,
      dateRange ? `with date range: ${JSON.stringify(dateRange)}` : ""
    );

    // Get user ID from context (will be passed from chat route)
    // @ts-ignore - userId is injected by the chat route
    const userId = globalThis.__currentUserId;

    if (!userId) {
      throw new Error(
        "User ID not found in context. Chat memory search requires authentication."
      );
    }

    try {
      // Search memories with or without date range
      const memories = dateRange
        ? await searchMemoriesWithDateRange(userId, query, dateRange, limit)
        : await searchMemories(userId, query, limit);

      if (memories.length === 0) {
        return {
          success: true,
          message: `No relevant conversations found for "${query}".`,
          memories: [],
        };
      }

      // Format results with temporal information
      const formattedResults = memories.map((memory, index) => {
        const { metadata } = memory;
        const timestamp = new Date(metadata.timestamp);
        const relativeTime = getRelativeTime(timestamp);

        return {
          index: index + 1,
          content: memory.memory,
          role: metadata.message_type,
          timestamp: metadata.timestamp,
          humanReadableTime: metadata.human_readable_time,
          relativeTime,
          chatId: metadata.chat_id,
          relevanceScore: memory.relevance_score,
        };
      });

      // Create a formatted summary for the AI
      const summary = `Found ${memories.length} relevant conversation(s):

${formattedResults
  .map(
    (result) =>
      `${result.index}. [${result.relativeTime} - ${result.humanReadableTime}]
   Role: ${result.role === "user" ? "You asked" : "Assistant responded"}
   Content: "${result.content}"
   Chat ID: ${result.chatId}`
  )
  .join("\n\n")}

When answering the user's question, include the specific date and time from the human_readable_time field.`;

      return {
        success: true,
        message: summary,
        memories: formattedResults,
        count: memories.length,
      };
    } catch (error: any) {
      console.error("[chatMemorySearch] Error:", error);
      return {
        success: false,
        error: error.message || "Failed to search chat memories",
        memories: [],
      };
    }
  },
};

/**
 * Helper function to get relative time description
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/**
 * Helper function to parse natural language dates
 * Can be enhanced with a library like chrono-node for more sophisticated parsing
 */
export function parseNaturalDateRange(
  timeReference: string
): { start?: string; end?: string } | undefined {
  const now = new Date();
  const timeRefLower = timeReference.toLowerCase();

  // Today
  if (timeRefLower.includes("today")) {
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    return {
      start: startOfDay.toISOString(),
      end: new Date().toISOString(),
    };
  }

  // Yesterday
  if (timeRefLower.includes("yesterday")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));
    return {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString(),
    };
  }

  // Last week
  if (timeRefLower.includes("last week")) {
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return {
      start: lastWeek.toISOString(),
      end: now.toISOString(),
    };
  }

  // Last month
  if (timeRefLower.includes("last month")) {
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return {
      start: lastMonth.toISOString(),
      end: now.toISOString(),
    };
  }

  return undefined;
}
