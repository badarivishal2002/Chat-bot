export interface ToolDefinition {
  name: string
  description: string
  tool: any
}

export interface ToolContext {
  session: any
  messages: any[]
  chatId?: string
}