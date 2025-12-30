import { jsonSchema } from 'ai'
import { ToolDefinition, ToolContext } from './types'

export function createWebSearchTool(_context: ToolContext): ToolDefinition {
  return {
    name: 'webSearch',
    description: 'Search the web using Google Search API to find current information. Do NOT include any sources, citations, or "Sources:" sections in your response text - sources are handled separately by the UI.',
    tool: {
      description: 'Search the web for current information. Returns top search results with titles, snippets, and links. Do NOT include any sources, citations, or "Sources:" sections in your response text - sources are handled separately by the UI.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          numResults: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 5,
            description: 'Number of results to return (max 10)'
          }
        },
        required: ['query'],
        additionalProperties: false
      }),
      execute: async (args: { query: string; numResults?: number }) => {
        const { query, numResults = 5 } = args
        
        console.log('[TOOL] webSearch - Searching for:', query)
        
        try {
          const serpApiKey = process.env.SERPAPI_KEY
          
          if (!serpApiKey) {
            console.warn('SERPAPI_KEY not configured')
            return {
              error: 'Search API not configured. Please add SERPAPI_KEY to your environment variables.',
              results: []
            }
          }
          
          const params = new URLSearchParams({
            q: query,
            api_key: serpApiKey,
            num: numResults.toString(),
            engine: 'google'
          })
          
          const response = await fetch(`https://serpapi.com/search?${params}`)
          const data = await response.json()
          
          if (data.error) {
            console.error('[TOOL] webSearch - API error:', data.error)
            return {
              error: data.error,
              results: []
            }
          }
          
          const results = (data.organic_results || []).map((result: any) => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
            position: result.position,
            source: result.source || result.displayed_link || new URL(result.link).hostname
          }))
          
          console.log('[TOOL] webSearch - Found', results.length, 'results')
          
          // Create citation format similar to ragSearch
          const sources_for_citation = results.map((result: any) => ({
            title: result.title,
            url: result.link,  // Changed from 'link' to 'url' for consistency with extraction logic
            snippet: result.snippet,  // Added snippet for proper source display
            source: result.source,
            citation_format: `[${result.title}](${result.link})`
          }))
          
          return {
            query,
            total_results: results.length,
            results,
            sources_for_citation,
            answer_box: data.answer_box || null,
            knowledge_graph: data.knowledge_graph || null
          }
        } catch (error) {
          console.error('[TOOL] webSearch - Error:', error)
          return {
            error: 'Failed to perform web search',
            results: []
          }
        }
      }
    }
  }
}