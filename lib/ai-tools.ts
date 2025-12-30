import { jsonSchema } from 'ai'

export const aiTools = {
  internetSearch: {
    description: 'Search the internet for current information using Google search via SerpAPI. Use this when users ask for up-to-date information, news, or anything that requires current internet data.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find information on the internet'
        }
      },
      required: ['query'],
      additionalProperties: false
    }),
    execute: async (args: { query: string }) => {
      try {
        const serpApiKey = process.env.SERP_API_KEY
        if (!serpApiKey) {
          return { error: 'Search API not configured. Please set SERP_API_KEY environment variable.' }
        }

        const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(args.query)}&api_key=${serpApiKey}&num=5`
        
        const response = await fetch(searchUrl, {
          signal: AbortSignal.timeout(15000)
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        const results = data.organic_results?.map((result: any) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
          position: result.position
        })) || []

        return {
          query: args.query,
          results,
          count: results.length,
          searchEngine: 'Google (via SerpAPI)'
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { error: `Internet search failed: ${errorMessage}` }
      }
    }
  },

  webScrape: {
    description: 'Fetch and extract content from a specific webpage URL. Use this when users provide a specific URL and want you to analyze or extract information from that page.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The specific URL to scrape and extract content from'
        }
      },
      required: ['url'],
      additionalProperties: false
    }),
    execute: async (args: { url: string }) => {
      try {
        new URL(args.url) // Validate URL format
        
        const response = await fetch(args.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ChatBot/1.0)',
          },
          signal: AbortSignal.timeout(15000)
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()
        
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000)

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1].trim() : 'No title found'

        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
        const description = descMatch ? descMatch[1].trim() : 'No description found'

        return {
          url: args.url,
          title,
          description,
          content: textContent,
          contentLength: textContent.length,
          status: 'success'
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { error: `Failed to scrape ${args.url}: ${errorMessage}` }
      }
    }
  }
}
