import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { xai, createXai } from '@ai-sdk/xai'
import { deepseek } from '@ai-sdk/deepseek'
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import {
  saveUserMessage,
  saveAssistantMessage,
  updateChatTitle,
  getLastUserMessage
} from '@/lib/chat-service'
import { loadTools, ToolContext } from '@/app/tools'
import { addMemory } from '@/lib/memory-manager'
import { applyCaching, CacheableMessage } from '@/lib/llm-cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, chatId, selectedModel = 'gpt-4.1', messageId }: { messages: UIMessage[], chatId: string, selectedModel?: string, messageId?: string } = await req.json()
    console.log('💬 [CHAT] Processing chat request:', { chatId, userId: session.user.id, messageCount: messages.length, selectedModel })

    await connectDB()

    const lastUserMessage = getLastUserMessage(messages)
    const isEditing = Boolean(messageId)

    let sources: any[] = []
    
    // Model selection logic
    const getModel = () => {
      switch (selectedModel) {
        case 'gpt-5.2':
          return openai('gpt-5.2')
        case 'gpt-5':
          return openai('gpt-5.1')
        case 'gemini':
          return google('gemini-2.5-flash')
        case 'claude-4.5':
          return anthropic('claude-sonnet-4-5')
        case 'grok-beta':
        case 'grok-4.1-reasoning':
          // Create custom xAI instance with conversation ID header for caching
          if (chatId) {
            const customXai = createXai({
              headers: {
                'x-grok-conv-id': chatId
              }
            })
            return customXai('grok-4-1-fast-reasoning')
          }
          return xai('grok-4-1-fast-reasoning')
        case 'deepseek-chat':
          return deepseek('deepseek-chat')
        case 'gpt-4.1':
        default:
          return openai('gpt-4.1')
      }
    }
    
    // Get current date and time for temporal context
    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const isoDateTime = now.toISOString();

    const systemMessage = [
      'You are a helpful AI assistant for the user. ',
      '',
      `CURRENT DATE AND TIME: ${currentDateTime} (${isoDateTime})`,
      'Use this information to understand relative time references like "yesterday", "last week", "today", etc.',
      '',
      'You have access to several tools:',
      '- chatMemorySearch: Search through the user\'s past conversations and chat history',
      '- webSearch: Search the web for current information',
      '- webScraper: Extract content from specific web pages',
      selectedModel.startsWith('gpt') ? `- You have internet search capabilities and can provide up-to-date information${selectedModel.startsWith('gpt-4.1') ? ' with enhanced coding and instruction following abilities' : ''}` : '',
      '',
      'TOOL PRIORITIZATION & MULTI-STEP REASONING:',
      '1. You can use MULTIPLE tools in sequence to answer complex questions',
      '2. IMPORTANT: After using tools, you MUST provide a comprehensive answer to the user based on the tool results',
      '3. If the user asks about PAST CONVERSATIONS (e.g., "when did I ask", "what time did I mention"), use chatMemorySearch FIRST',
      '4. If one tool returns no results, try the next relevant tool:',
      '   - If chatMemorySearch finds nothing → try webSearch',
      '5. Use webSearch or webScraper when:',
      '   - chatMemorySearch returns no relevant results',
      '   - The question explicitly requires current/real-time information',
      '   - The user specifically asks for web information',
      '6. Tool usage examples:',
      '   - "Tell me about X" → Try chatMemorySearch first, then webSearch if needed',
      '   - "When did we discuss X?" → Use chatMemorySearch',
      '   - "What\'s the latest news about X?" → Use webSearch',
      '7. After calling tools, ALWAYS synthesize the results into a helpful answer for the user',
      '',
      'TEMPORAL QUERY HANDLING:',
      '- When user asks "when did I...", "what time did I...", use chatMemorySearch tool',
      '- For relative times (yesterday, last week), calculate the date range based on CURRENT DATE AND TIME above',
      '- Always include the exact timestamp from the search results in your response',
      '- Example: "You asked about X on January 7, 2025 at 3:45 PM (2 days ago)"',
      '',
      // NOTE: Sources are now auto-appended at the end of the response
      // LLM should NOT manually add sources - they will be added automatically
      'IMPORTANT: Sources from tools will be automatically cited at the end of your response.',
      'Do NOT manually add a "Sources:" section - it will be added automatically.',
      'Focus on providing a comprehensive answer using the information from the tools.',
      '',
      ''
    ].join('\n')

    // Save user message to database
    if (chatId && lastUserMessage) {
      console.log('💬 [CHAT] Saving user message to database')
      // Extract content from different possible properties
      const messageContent = lastUserMessage.content || lastUserMessage.text ||
                           (lastUserMessage.parts && lastUserMessage.parts[0]?.text) ||
                           ''
      await saveUserMessage(chatId, session.user.id, messageContent, messageId)

      // Store user message in Mem0 for conversation memory (fire and forget - don't block)
      addMemory(session.user.id, messageContent, {
        timestamp: new Date().toISOString(),
        chat_id: chatId,
        user_id: session.user.id,
        message_type: 'user',
      }).catch(error => {
        console.error('💬 [CHAT] Error storing user message in Mem0:', error)
        // Don't fail the request if Mem0 fails - it's supplementary
      })
    }

    // Load all tools dynamically
    const toolContext: ToolContext = {
      session,
      messages,
      chatId
    }
    const tools = await loadTools(toolContext)
    if (isEditing && 'chatMemorySearch' in tools) {
      console.log('💬 [CHAT] Editing mode detected - disabling chatMemorySearch tool')
      delete (tools as any).chatMemorySearch
    }

    console.log('💬 [CHAT] Starting text generation with tools:', Object.keys(tools))

    // Track if the stream was aborted
    let wasAborted = false
    const abortController = new AbortController()

    // Listen for client disconnect
    req.signal.addEventListener('abort', () => {
      console.log('💬 [CHAT] Stream aborted by client')
      wasAborted = true
      abortController.abort()
    })

    // Check if model supports temperature
    // GPT-5.1 with default reasoning_effort='none' DOES support temperature
    const supportsTemperature = true

    // Prepare messages and apply caching (works for all LLM providers)
    const convertedMessages = await convertToModelMessages(messages)
    const baseMessages: CacheableMessage[] = [
      { role: 'system', content: systemMessage },
      ...convertedMessages
    ]

    // Apply caching for all LLM providers
    // Note: For Grok, x-grok-conv-id header is set at provider level in getModel()
    const { messages: cachedMessages, extraOptions } = applyCaching(baseMessages, selectedModel)

    const result = streamText({
      model: getModel(),
      messages: cachedMessages,
      tools,
      toolChoice: 'auto',
      ...(supportsTemperature && { temperature: 0.3 }), // Only set temperature for models that support it
      ...(extraOptions || {}), // Spread provider-specific cache options (e.g., cached_prompt_retention for GPT-5.1, x-grok-conv-id for Grok)
      stopWhen: stepCountIs(15), // Increased from 10 to 15 to handle complex multi-step conversations
      abortSignal: abortController.signal,
      onStepFinish: (step: any) => {
        console.log('💬 [CHAT] Step finished:', {
          stepType: step.stepType || 'unknown',
          toolCalls: step.toolCalls?.length || 0,
          toolResults: step.toolResults?.length || 0,
          text: step.text?.substring(0, 100) || '(empty)',
          finishReason: step.finishReason || 'unknown',
        });

        // Extract sources from tool results
        if (step.toolResults && step.toolResults.length > 0) {
          step.toolResults.forEach((toolResult: any) => {
            // Extract sources from tool results
            // The AI SDK might return the result in different properties
            const result = toolResult.result || toolResult.output || toolResult.args
            if (result) {

              // Handle sources_for_citation array (from ragSearch, webSearch)
              if (Array.isArray(result.sources_for_citation)) {
                result.sources_for_citation.forEach((source: any) => {
                  // All tools now return consistent format: { title, url, snippet, source, citation_format }
                  // Fallbacks maintained for backwards compatibility
                  const sourceUrl = source.url || source.document_url || source.link || ''
                  const sourceTitle = source.title || source.document_name || source.name || 'Untitled'

                  // Avoid duplicates based on URL or title
                  const exists = sources.some(s =>
                    (sourceUrl && s.url === sourceUrl) ||
                    (s.title === sourceTitle && !sourceUrl)
                  )

                  if (!exists) {
                    // Extract hostname from URL if available
                    let hostname = source.source || ''
                    if (!hostname && sourceUrl) {
                      try {
                        hostname = new URL(sourceUrl).hostname
                      } catch {
                        // Invalid URL, leave hostname empty
                      }
                    }

                    // Get snippet - for RAG results, we might get the text from results array
                    let snippet = source.snippet || source.description || source.text_snippet || ''

                    // If no snippet but we have results array, try to get first matching result's text
                    if (!snippet && Array.isArray(result.results)) {
                      const matchingResult = result.results.find((r: any) =>
                        r.document_name === sourceTitle || r.document_id === source.document_id
                      )
                      if (matchingResult && matchingResult.text) {
                        // Truncate to 150 characters
                        snippet = matchingResult.text.substring(0, 150).trim()
                        if (matchingResult.text.length > 150) snippet += '...'
                      }
                    }

                    sources.push({
                      title: sourceTitle,
                      url: sourceUrl,
                      snippet,
                      source: hostname,
                    })
                  }
                })
              }

              // Handle single source_for_citation object (from webScraper)
              if (result.source_for_citation && typeof result.source_for_citation === 'object') {
                const source = result.source_for_citation
                const sourceUrl = source.url || source.link || ''
                const sourceTitle = source.title || source.name || 'Untitled'

                const exists = sources.some(s =>
                  (sourceUrl && s.url === sourceUrl) ||
                  (s.title === sourceTitle && !sourceUrl)
                )

                if (!exists) {
                  // Extract hostname from URL if available
                  let hostname = source.source || ''
                  if (!hostname && sourceUrl) {
                    try {
                      hostname = new URL(sourceUrl).hostname
                    } catch {
                      // Invalid URL, leave hostname empty
                    }
                  }

                  sources.push({
                    title: sourceTitle,
                    url: sourceUrl,
                    snippet: source.snippet || source.description || '',
                    source: hostname,
                  })
                }
              }
            }
          })
        }
      },
      onFinish: async (event) => {
        // Detect if we hit the step limit
        const hitStepLimit = event.finishReason === 'stop' && (!event.text || event.text.trim().length === 0)

        console.log('💬 [CHAT] Text generation finished:', {
          responseLength: event.text.length,
          finishReason: event.finishReason,
          hitStepLimit,
        })

        // Don't save if the stream was aborted or response is empty/trivial
        if (wasAborted) {
          console.log('💬 [CHAT] Skipping save - stream was aborted')
          return
        }

        if (!event.text || event.text.trim().length === 0) {
          console.log('⚠️ [CHAT] Response is empty - likely hit step limit, sending fallback message')

          // Instead of leaving user stuck, send a helpful fallback message
          const fallbackMessage = `I apologize, but I reached my processing limit while trying to answer your question. I performed multiple searches and analyses, but couldn't synthesize a complete response within the allowed steps.

**What happened:**
- I made too many tool calls (searches, data retrieval, etc.) trying to find the perfect answer
- Hit the maximum step limit (15 steps) before completing

**Please try:**
1. **Simplify your question** - Ask about one specific aspect at a time
2. **Be more direct** - Specify exactly what information you need
3. **Break it down** - Split complex questions into smaller parts

I'm here to help - just need a more focused question! 🎯`

          // Save the fallback message so user sees it instead of nothing
          if (chatId) {
            try {
              await saveAssistantMessage(chatId, session.user.id, fallbackMessage)
              console.log('💬 [CHAT] Fallback message saved successfully')
            } catch (error) {
              console.error('💬 [CHAT] Failed to save fallback message:', error)
            }
          }
          return
        }

        if (chatId) {
          console.log('💬 [CHAT] Saving assistant message to database')

          // Convert sources array to the format expected by saveAssistantMessage
          const sourcesForSave = sources.map(s => ({
            title: s.title || 'Untitled',
            url: s.url,
            snippet: s.snippet,
            source: s.source
          }))

          await saveAssistantMessage(chatId, session.user.id, event.text, sourcesForSave)
          console.log('💬 [CHAT] Message saved successfully')

          // Store assistant response in Mem0 for conversation memory (fire and forget - don't block)
          addMemory(session.user.id, event.text, {
            timestamp: new Date().toISOString(),
            chat_id: chatId,
            user_id: session.user.id,
            message_type: 'assistant',
          }).catch(error => {
            console.error('💬 [CHAT] Error storing assistant message in Mem0:', error)
            // Don't fail the request if Mem0 fails - it's supplementary
          })

          if (lastUserMessage) {
            console.log('💬 [CHAT] Updating chat title')
            const messageContent = lastUserMessage.content || lastUserMessage.text ||
                                 (lastUserMessage.parts && lastUserMessage.parts[0]?.text) ||
                                 ''
            await updateChatTitle(chatId, session.user.id, messageContent)
          }
        }
      }
    })

    // Convert to response - use toUIMessageStreamResponse to stream tool calls and text
    const response = result.toUIMessageStreamResponse()

    // Add sources to custom header (available INSTANTLY before stream starts!)
    if (sources.length > 0) {
      // Compress sources to fit in header (max ~8KB)
      const sourcesData = JSON.stringify(sources)

      // If too large for header, send just basic info
      const sourcesToSend = sourcesData.length > 7000
        ? sources.map(s => ({ title: s.title, url: s.url })) // Minimal data
        : sources // Full data

      const headers = new Headers(response.headers)
      headers.set('X-Chat-Sources', JSON.stringify(sourcesToSend))

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    }

    return response

  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 
