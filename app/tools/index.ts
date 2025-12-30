import { ToolContext, ToolDefinition } from './types'
import { createWebSearchTool } from './web-search'
import { createWebScraperTool } from './web-scraper'
import { createChatMemorySearchTool } from './chat-memory-search-wrapper'
import { createMCPTools } from './mcp-tools'

const toolCreators = {
  chatMemorySearch: createChatMemorySearchTool,
  webSearch: createWebSearchTool,
  webScraper: createWebScraperTool,
}

export async function loadTools(context: ToolContext): Promise<Record<string, any>> {
  const tools: Record<string, any> = {}

  // Load standard tools
  for (const [key, createTool] of Object.entries(toolCreators)) {
    try {
      const toolDef: ToolDefinition = createTool(context)
      tools[toolDef.name] = toolDef.tool
      console.log(`[TOOLS] Loaded tool: ${toolDef.name}`)
    } catch (error) {
      console.error(`[TOOLS] Failed to load tool ${key}:`, error)
    }
  }

  // Load MCP tools (GitHub, Google Drive, Gmail, etc.)
  try {
    const mcpTools = await createMCPTools(context)
    Object.assign(tools, mcpTools)
    console.log(`[MCP] Loaded ${Object.keys(mcpTools).length} MCP tools`)
  } catch (error) {
    console.error('[MCP] Failed to load MCP tools:', error)
  }

  return tools
}


export type { ToolContext, ToolDefinition } from './types'
