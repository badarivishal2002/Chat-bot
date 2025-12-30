# AI Tools System

This directory contains the modular tools system for the LLM chat interface. Each tool is defined in its own file and is automatically loaded when the chat API starts.

## Structure

```
app/tools/
├── index.ts         # Tool loader and registry
├── types.ts         # TypeScript interfaces for tools
├── rag-search.ts    # Document search tool
├── web-search.ts    # Web search tool (SERP API)
├── web-scraper.ts   # Web scraping tool
└── README.md        # This file
```

## Adding a New Tool

To add a new tool, follow these steps:

### 1. Create a new tool file

Create a new file in the `app/tools/` directory, e.g., `my-tool.ts`:

```typescript
import { jsonSchema } from 'ai'
import { ToolDefinition, ToolContext } from './types'

export function createMyTool(context: ToolContext): ToolDefinition {
  const { session, messages, chatId } = context
  
  return {
    name: 'myTool',
    description: 'Brief description for the LLM',
    tool: {
      description: 'Detailed description of what the tool does',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Description of parameter 1'
          },
          param2: {
            type: 'number',
            default: 10,
            description: 'Description of parameter 2'
          }
        },
        required: ['param1'],
        additionalProperties: false
      }),
      execute: async (args: { param1: string; param2?: number }) => {
        // Your tool logic here
        console.log('[TOOL] myTool - Processing:', args)
        
        try {
          // Implement your functionality
          const result = await someFunction(args.param1)
          
          return {
            success: true,
            data: result
          }
        } catch (error) {
          console.error('[TOOL] myTool - Error:', error)
          return {
            success: false,
            error: 'Failed to execute tool'
          }
        }
      }
    }
  }
}
```

### 2. Register the tool

Add your tool to the `toolCreators` object in `app/tools/index.ts`:

```typescript
import { createMyTool } from './my-tool'

const toolCreators = {
  ragSearch: createRagSearchTool,
  webSearch: createWebSearchTool,
  webScraper: createWebScraperTool,
  myTool: createMyTool,  // Add your tool here
}
```

### 3. Update system message (optional)

If your tool requires special instructions, update the system message in `app/api/chat/route.ts` to inform the LLM about the new tool.

## Available Tools

### ragSearch
Searches through user-uploaded documents using vector similarity search.
- **Input**: query (optional), topK (number of results)
- **Output**: Relevant document chunks with metadata

### webSearch
Searches the web using SERP API for current information.
- **Input**: query (required), numResults (optional)
- **Output**: Search results with titles, links, and snippets
- **Requires**: `SERPAPI_KEY` environment variable

### webScraper
Fetches and extracts content from web pages.
- **Input**: url (required), selector (optional CSS selector), extractMetadata (boolean)
- **Output**: Page content, metadata, and links

## Environment Variables

Some tools require environment variables to function:

```env
SERPAPI_KEY=your_serpapi_key_here  # For web search functionality
```

## Tool Context

Each tool receives a `ToolContext` object containing:
- `session`: The current user session
- `messages`: Conversation history
- `chatId`: Current chat identifier (optional)

## Best Practices

1. **Error Handling**: Always wrap your execute function in try-catch blocks
2. **Logging**: Use console.log with clear prefixes for better debugging ([TOOL], [RAG], etc.)
3. **Input Validation**: Use jsonSchema for robust input validation
4. **Return Format**: Return consistent, well-structured data
5. **Performance**: Keep tools lightweight and fast
6. **Documentation**: Provide clear descriptions for both the LLM and developers

## Dynamic Loading

The system supports both static and dynamic tool loading:

- **Static Loading** (default): Tools are imported directly in `index.ts`
- **Dynamic Loading**: Use `loadToolsDynamic()` to automatically discover and load tools from the directory

## Testing Tools

To test a new tool:

1. Add the tool following the steps above
2. Restart the development server
3. Check the console for successful tool loading messages
4. Test through the chat interface by asking the LLM to use your tool

## Troubleshooting

- **Tool not loading**: Check console for error messages, ensure export name matches pattern
- **Tool not being used**: Update system message to inform LLM about the tool
- **Missing dependencies**: Install required packages (e.g., `npm install package-name`)