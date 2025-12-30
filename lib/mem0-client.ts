import { MemoryClient } from "mem0ai";

/**
 * Mem0 Client Configuration
 *
 * Provides a singleton instance of the Mem0 client for managing
 * conversation memories and enabling semantic search across chat history.
 */

let mem0Client: MemoryClient | null = null;

/**
 * Initialize and return the Mem0 client instance
 *
 * @returns MemoryClient instance configured with API key
 * @throws Error if MEM0_API_KEY is not set in environment variables
 */
export function getMem0Client(): MemoryClient {
  if (!mem0Client) {
    const apiKey = process.env.MEM0_API_KEY;

    if (!apiKey) {
      throw new Error(
        "MEM0_API_KEY is not set in environment variables. " +
        "Please add it to your .env.local file."
      );
    }

    mem0Client = new MemoryClient({ apiKey });
  }

  return mem0Client;
}

/**
 * Optional: For self-hosted Mem0 instances
 * Uncomment and configure if you're running Mem0 on your own infrastructure
 */
/*
export function getMem0Client(): MemoryClient {
  if (!mem0Client) {
    const host = process.env.MEM0_HOST || "http://localhost:8000";

    mem0Client = new MemoryClient({
      host,
      // Add other self-hosted configuration options here
    });
  }

  return mem0Client;
}
*/
