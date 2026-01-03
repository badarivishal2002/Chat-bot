import { ToolContext, ToolDefinition } from './types'
import { getUserMCPTools, executeMCPTool } from '@/lib/mcp-tools/tool-executor'
import { jsonSchema } from 'ai'

/**
 * Create MCP tools dynamically based on user's connected integrations
 */
export async function createMCPTools(context: ToolContext): Promise<Record<string, any>> {
  const { session } = context

  if (!session?.user?.id) {
    return {}
  }

  try {
    // Get user's available MCP tools
    const { tools: mcpToolDefs } = await getUserMCPTools(session.user.id)

    if (mcpToolDefs.length === 0) {
      console.log('[MCP] No integrations connected')
      return {}
    }

    console.log(`[MCP] Loading ${mcpToolDefs.length} tools from integrations`)

    const mcpTools: Record<string, any> = {}

    // Convert each MCP tool definition to an AI SDK tool
    for (const toolDef of mcpToolDefs) {
      const toolName = toolDef.function.name
      const toolDescription = toolDef.function.description
      const toolParams = toolDef.function.parameters

      // Ensure the schema has proper structure for OpenAI
      const schema = {
        type: 'object' as const,
        properties: toolParams.properties || {},
        required: toolParams.required || [],
        additionalProperties: false
      }

      // Create AI SDK tool using jsonSchema (not Zod)
      mcpTools[toolName] = {
        description: toolDescription,
        inputSchema: jsonSchema(schema),
        execute: async (args: Record<string, any>) => {
          console.log(`🔧 [MCP] Executing ${toolName}`, args)

          try {
            const result = await executeMCPTool(session.user.id, toolName, args)

            // Format result for AI consumption
            return {
              success: true,
              data: result,
              message: `Successfully executed ${toolName}`
            }
          } catch (error: any) {
            console.error(`❌ [MCP] Tool execution failed: ${toolName}`, error)

            return {
              success: false,
              error: error.message || 'Tool execution failed',
              message: error.message
            }
          }
        }
      }

      console.log(`[MCP] ✅ Loaded tool: ${toolName}`)
    }

    return mcpTools
  } catch (error) {
    console.error('[MCP] Error loading MCP tools:', error)
    return {}
  }
}
