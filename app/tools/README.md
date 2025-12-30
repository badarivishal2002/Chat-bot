# AI Tools System

This directory contains the modular tools system for the MetaWurks AI Agent. Each tool is defined in its own file and is automatically loaded when the chat API starts.

## Structure

```
app/tools/
├── index.ts                      # Tool loader and registry
├── types.ts                      # TypeScript interfaces for tools
├── chat-memory-search.ts         # Core Mem0 memory search implementation
├── chat-memory-search-wrapper.ts # Tool wrapper for memory search
├── web-search.ts                 # Web search tool (SERP API)
├── web-scraper.ts                # Web scraping tool (Cheerio)
├── mcp-tools.ts                  # MCP integration loader
└── README.md                     # This file
```

## Available Tools

### 1. chatMemorySearch
Searches through the user's conversation history using semantic search powered by Mem0.

- **Input**:
  - `query` (required): The search query
  - `limit` (optional, default: 5): Number of results to return
- **Output**: Relevant conversation snippets with timestamps and context
- **Use Cases**:
  - "What did I ask you last week about project deadlines?"
  - "Find all our discussions about the new feature"
  - Temporal queries with date/time context
- **Requires**: `MEM0_API_KEY` environment variable
- **File**: [chat-memory-search.ts](chat-memory-search.ts), [chat-memory-search-wrapper.ts](chat-memory-search-wrapper.ts)

### 2. webSearch
Searches the web using SERP API for current information.

- **Input**:
  - `query` (required): Search query string
  - `numResults` (optional, default: 5): Number of results to return
- **Output**: Search results with titles, URLs, and snippets formatted for citation
- **Use Cases**:
  - Current events and news
  - Research and fact-checking
  - Finding external resources
- **Requires**: `SERPAPI_KEY` environment variable
- **File**: [web-search.ts](web-search.ts)

### 3. webScraper
Fetches and extracts content from web pages using Cheerio.

- **Input**:
  - `url` (required): The webpage URL to scrape
  - `selector` (optional): CSS selector for targeted extraction
  - `extractMetadata` (optional, default: true): Extract page metadata
- **Output**: Page content, title, metadata, and source citation
- **Use Cases**:
  - Extract article content
  - Parse documentation
  - Gather data from specific web pages
- **File**: [web-scraper.ts](web-scraper.ts)

### 4. MCP Tools (7 Integration Types)
OAuth-based tools for external service integration via Model Context Protocol.

#### GitHub
- `github_list_repos`: List user repositories
- `github_search_code`: Search code across repositories
- `github_create_issue`: Create issues
- `github_get_user`: Get user information

#### Google Drive
- `drive_list_files`: List files and folders
- `drive_search_files`: Search files by query
- `drive_get_file_info`: Get file metadata

#### Gmail
- `gmail_list_messages`: List recent messages
- `gmail_search_messages`: Search emails
- `gmail_send_message`: Send emails
- `gmail_get_unread_count`: Get unread count

#### Slack
- `slack_list_channels`: List workspace channels
- `slack_send_message`: Post messages
- `slack_search_messages`: Search message history
- `slack_list_users`: List workspace users

#### Google Calendar
- `calendar_list_events`: List upcoming events
- `calendar_create_event`: Create calendar events
- `calendar_search_events`: Search events

#### Jira
- `jira_list_projects`: List projects
- `jira_list_issues`: List project issues
- `jira_create_issue`: Create new issues
- `jira_search_issues`: Search issues

#### Notion
- `notion_search`: Search workspace
- `notion_list_pages`: List pages
- `notion_create_page`: Create pages
- `notion_query_database`: Query databases

**Requires**: OAuth credentials for each integration (see [INTEGRATION_SETUP.md](../../INTEGRATION_SETUP.md))
**File**: [mcp-tools.ts](mcp-tools.ts), [lib/mcp-tools/](../../lib/mcp-tools/)

## Adding a New Tool

To add a new tool, follow these steps:

### 1. Create a new tool file

Create a new file in the `app/tools/` directory, e.g., `code-execution.ts`:

```typescript
import { jsonSchema } from 'ai'
import { ToolDefinition, ToolContext } from './types'

export function createCodeExecutionTool(context: ToolContext): ToolDefinition {
  const { session, messages, chatId } = context

  return {
    name: 'executeCode',
    description: 'Execute code in a sandboxed environment',
    tool: {
      description: 'Runs code safely in an isolated sandbox and returns the output',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code to execute'
          },
          language: {
            type: 'string',
            enum: ['python', 'javascript', 'typescript', 'bash'],
            description: 'Programming language'
          },
          timeout: {
            type: 'number',
            default: 30,
            description: 'Execution timeout in seconds'
          }
        },
        required: ['code', 'language'],
        additionalProperties: false
      }),
      execute: async (args: { code: string; language: string; timeout?: number }) => {
        console.log('[TOOL] executeCode - Running:', args.language)

        try {
          // Your sandbox execution logic here
          const result = await runInSandbox(args.code, args.language, args.timeout)

          return {
            success: true,
            output: result.stdout,
            error: result.stderr,
            exitCode: result.exitCode
          }
        } catch (error) {
          console.error('[TOOL] executeCode - Error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Execution failed'
          }
        }
      }
    }
  }
}
```

### 2. Register the tool

Add your tool to the `toolCreators` object in [app/tools/index.ts](index.ts):

```typescript
import { createCodeExecutionTool } from './code-execution'

const toolCreators = {
  chatMemorySearch: createChatMemorySearchTool,
  webSearch: createWebSearchTool,
  webScraper: createWebScraperTool,
  codeExecution: createCodeExecutionTool,  // Add your tool here
}
```

### 3. Update system message (optional)

If your tool requires special instructions, update the system message in [app/api/chat/route.ts](../../app/api/chat/route.ts:87-128) to inform the LLM about when and how to use the new tool.

## Tool Context

Each tool receives a `ToolContext` object containing:
- `session`: The current user session with user ID and authentication info
- `messages`: Full conversation history for context
- `chatId`: Current chat identifier (optional)

This allows tools to:
- Access user-specific data
- Make authenticated API calls
- Use conversation context for better results
- Track tool usage per chat

## Environment Variables

Tools require the following environment variables:

```env
# Web Search
SERPAPI_KEY=your_serpapi_key_here

# Conversation Memory
MEM0_API_KEY=your_mem0_api_key_here

# OAuth Integrations (MCP Tools)
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_secret

GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_secret

SLACK_OAUTH_CLIENT_ID=your_slack_client_id
SLACK_OAUTH_CLIENT_SECRET=your_slack_secret

JIRA_OAUTH_CLIENT_ID=your_jira_client_id
JIRA_OAUTH_CLIENT_SECRET=your_jira_secret

NOTION_OAUTH_CLIENT_ID=your_notion_client_id
NOTION_OAUTH_CLIENT_SECRET=your_notion_secret
```

See [INTEGRATION_SETUP.md](../../INTEGRATION_SETUP.md) for detailed OAuth setup instructions.

## Tool Loading Process

1. **Standard Tools**: Loaded synchronously from `toolCreators` object
2. **MCP Tools**: Loaded asynchronously, checking for user integrations
3. **Error Handling**: Failed tools are logged but don't block other tools
4. **Dynamic Loading**: Tools are instantiated per-request with fresh context

```typescript
// From app/tools/index.ts
export async function loadTools(context: ToolContext): Promise<Record<string, any>> {
  const tools: Record<string, any> = {}

  // Load standard tools (chatMemorySearch, webSearch, webScraper)
  for (const [key, createTool] of Object.entries(toolCreators)) {
    const toolDef: ToolDefinition = createTool(context)
    tools[toolDef.name] = toolDef.tool
  }

  // Load MCP tools if user has integrations configured
  const mcpTools = await createMCPTools(context)
  Object.assign(tools, mcpTools)

  return tools
}
```

## Best Practices

1. **Error Handling**: Always wrap your execute function in try-catch blocks
   ```typescript
   try {
     const result = await yourFunction()
     return { success: true, data: result }
   } catch (error) {
     console.error('[TOOL] yourTool - Error:', error)
     return { success: false, error: 'User-friendly error message' }
   }
   ```

2. **Logging**: Use consistent logging prefixes for debugging
   - `[TOOL]` - Standard tool operations
   - `[MCP]` - MCP integration operations
   - `[MEMORY]` - Memory/Mem0 operations
   - `[SEARCH]` - Search operations

3. **Input Validation**: Use `jsonSchema()` for robust validation (not Zod)
   - Compatible with Vercel AI SDK
   - Automatic type inference
   - Clear error messages

4. **Return Format**: Provide structured, citation-friendly responses
   ```typescript
   return {
     success: true,
     data: yourData,
     source_for_citation: {  // For single sources
       title: 'Source Title',
       url: 'https://example.com',
       snippet: 'Relevant excerpt...'
     },
     sources_for_citation: [  // For multiple sources
       { title: '...', url: '...', snippet: '...' }
     ]
   }
   ```

5. **Performance**:
   - Keep tools lightweight and fast
   - Use timeouts for external API calls
   - Cache results when appropriate
   - Handle rate limits gracefully

6. **Documentation**:
   - Provide clear descriptions for the LLM
   - Document parameters thoroughly
   - Include usage examples
   - Explain when the tool should be used

7. **Security**:
   - Validate all user inputs
   - Sanitize URLs before scraping
   - Never expose API keys in responses
   - Use user-scoped data access

## Testing Tools

To test a new tool:

1. **Add the tool** following the steps above
2. **Set environment variables** in `.env` file
3. **Restart the development server**: `npm run dev`
4. **Check console logs** for successful tool loading:
   ```
   [TOOLS] Loaded tool: yourTool
   ```
5. **Test in chat interface** by asking the LLM to use your tool:
   - "Search the web for recent AI news" → webSearch
   - "What did I say about deadlines yesterday?" → chatMemorySearch
   - "Get the content from https://example.com" → webScraper

## Tool Usage in Chat

Tools are automatically invoked by the LLM based on:
- User query intent
- Tool descriptions and parameters
- System prompt instructions
- Multi-step reasoning (up to 15 steps)

The chat API ([app/api/chat/route.ts](../../app/api/chat/route.ts)) uses:
- `toolChoice: 'auto'` - LLM decides when to use tools
- `maxSteps: 15` - Up to 15 tool invocations per response
- Automatic source extraction and citation

## Troubleshooting

### Tool not loading
- **Check console** for error messages during server startup
- **Verify imports** in `index.ts` match your file exports
- **Ensure dependencies** are installed: `npm install`

### Tool not being used by LLM
- **Update system prompt** to mention the tool explicitly
- **Check tool description** - make it clear when to use
- **Verify tool parameters** are properly documented
- **Test tool manually** - ensure it works when called

### Missing dependencies
```bash
# For web scraping
npm install cheerio axios

# For web search
npm install serpapi

# For MCP tools
npm install @octokit/rest googleapis nodemailer
```

### OAuth integration issues
- **Check redirect URIs** in OAuth provider console
- **Verify credentials** in `.env` file
- **Refresh tokens** using `/api/integrations/refresh-all`
- See [INTEGRATION_SETUP.md](../../INTEGRATION_SETUP.md) for detailed troubleshooting

## Upcoming Agent Capabilities (Feature 1)

The tools system is designed to support the following advanced agent capabilities:

### 1. Code Sandbox
- Execute Python, JavaScript, TypeScript, Bash
- File creation and manipulation (PPT, DOC, PDF)
- Internet access from sandbox
- **Status**: Planned

### 2. Infinite Context
- Automatic summarization
- Hierarchical context storage
- Smart retrieval from Mem0
- **Status**: Foundation ready (Mem0 integrated)

### 3. Subagents
- Task decomposition
- Specialized agent spawning
- Multi-agent orchestration
- **Status**: Planned

### 4. Skills Framework
- Document generation (PowerPoint, Word, PDF)
- Data analysis and visualization
- Web automation
- Code operations
- **Status**: Planned

### 5. LLM Ensemble
- Automatic model selection
- Task complexity classification
- Cost optimization
- **Status**: Foundation ready (multi-model support)

## Contributing

When adding new tools:
1. Follow the existing code patterns
2. Add comprehensive error handling
3. Update this README with tool documentation
4. Test thoroughly before committing
5. Update system prompts if needed

## Related Documentation

- [INTEGRATION_SETUP.md](../../INTEGRATION_SETUP.md) - OAuth integration setup
- [app/api/chat/route.ts](../../app/api/chat/route.ts) - Main chat API endpoint
- [lib/mcp-tools/](../../lib/mcp-tools/) - MCP tool implementations
- [lib/memory-manager.ts](../../lib/memory-manager.ts) - Mem0 integration
