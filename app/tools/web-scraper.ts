import { jsonSchema } from 'ai'
import { ToolDefinition, ToolContext } from './types'
import * as cheerio from 'cheerio'

export function createWebScraperTool(_context: ToolContext): ToolDefinition {
  return {
    name: 'webScraper',
    description: 'Fetch and extract content from a web page. Do NOT include any sources, citations, or "Source:" sections in your response text - sources are handled separately by the UI.',
    tool: {
      description: 'Fetch and extract content from a web page. Returns the main text content, metadata, and optionally specific elements. Do NOT include any sources, citations, or "Source:" sections in your response text - sources are handled separately by the UI.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to scrape'
          },
          selector: {
            type: 'string',
            description: 'Optional CSS selector to extract specific elements'
          },
          extractMetadata: {
            type: 'boolean',
            default: true,
            description: 'Whether to extract page metadata (title, description, etc.)'
          },
          maxLength: {
            type: 'number',
            default: 5000,
            description: 'Maximum length of content to return (characters)'
          }
        },
        required: ['url'],
        additionalProperties: false
      }),
      execute: async (args: { 
        url: string; 
        selector?: string; 
        extractMetadata?: boolean;
        maxLength?: number 
      }) => {
        const { url, selector, extractMetadata = true, maxLength = 5000 } = args
        
        console.log('[TOOL] webScraper - Fetching:', url)
        
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ChatBot/1.0)'
            }
          })
          
          if (!response.ok) {
            console.error('[TOOL] webScraper - HTTP error:', response.status)
            return {
              error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
              url,
              content: null
            }
          }
          
          const html = await response.text()
          const $ = cheerio.load(html)
          
          // Remove script and style elements
          $('script, style, noscript').remove()
          
          let content: string = ''
          
          if (selector) {
            // Extract specific elements if selector provided
            const elements = $(selector)
            content = elements.map((_: any, el: any) => $(el).text().trim()).get().join('\n\n')
          } else {
            // Try to extract main content
            const mainSelectors = [
              'main',
              'article', 
              '[role="main"]',
              '#content',
              '.content',
              'body'
            ]
            
            for (const sel of mainSelectors) {
              const element = $(sel).first()
              if (element.length > 0) {
                content = element.text().trim()
                if (content.length > 100) break
              }
            }
            
            // Fallback to body if no main content found
            content = content || $('body').text().trim()
          }
          
          // Clean up whitespace
          content = content.replace(/\s+/g, ' ').trim()
          
          // Truncate if too long
          if (content.length > maxLength) {
            content = content.substring(0, maxLength) + '...'
          }
          
          // Extract metadata
          const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || 'Untitled'
          const description = $('meta[name="description"]').attr('content') || 
                            $('meta[property="og:description"]').attr('content') || null
          
          const result: any = {
            url,
            content,
            length: content.length,
            title,
            source: new URL(url).hostname
          }
          
          if (extractMetadata) {
            result.metadata = {
              title,
              description,
              author: $('meta[name="author"]').attr('content') || null,
              keywords: $('meta[name="keywords"]').attr('content') || null,
              ogImage: $('meta[property="og:image"]').attr('content') || null,
              canonical: $('link[rel="canonical"]').attr('href') || null
            }
          }
          
          // Extract links if present in content
          const links = new Set<string>()
          $('a[href]').each((_: any, el: any) => {
            const href = $(el).attr('href')
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
              links.add(href)
            }
          })
          
          if (links.size > 0) {
            result.links = Array.from(links).slice(0, 20)
          }
          
          // Add citation format
          result.source_for_citation = {
            title,
            url,  // Already using 'url' - correct!
            snippet: description || null,  // Added snippet for consistency
            source: result.source,
            citation_format: `[${title}](${url})`
          }
          
          console.log('[TOOL] webScraper - Extracted', content.length, 'characters from', result.source)
          
          return result
        } catch (error: any) {
          console.error('[TOOL] webScraper - Error:', error)
          return {
            error: `Failed to scrape URL: ${error.message}`,
            url,
            content: null
          }
        }
      }
    }
  }
}