export type ProviderType = 'claude' | 'openai' | 'gemini' | 'deepseek' | 'grok' | 'other'
export type CacheableMessage = any

export function detectProvider(model: string): ProviderType {
  if (model.includes('claude')) return 'claude'
  if (model.includes('gpt')) return 'openai'
  if (model.includes('gemini')) return 'gemini'
  if (model.includes('deepseek')) return 'deepseek'
  if (model.includes('grok')) return 'grok'
  return 'other'
}

export function applyClaudeCaching(messages: CacheableMessage[]): CacheableMessage[] {
  if (messages.length === 0) return messages

  const cached = [...messages]
  const maxBreakpoints = 4
  let breakpointsAdded = 0

  if (cached[0]?.role === 'system' && breakpointsAdded < maxBreakpoints) {
    cached[0] = {
      ...cached[0],
      providerOptions: {
        anthropic: {
          cacheControl: { type: 'ephemeral' }
        }
      }
    }
    breakpointsAdded++
  }

  const excludeLastN = 2
  const cacheableLength = cached.length - excludeLastN

  if (cacheableLength > 1) {
    const remainingBreakpoints = maxBreakpoints - breakpointsAdded
    const interval = Math.floor(cacheableLength / (remainingBreakpoints + 1))

    for (let i = 1; i <= remainingBreakpoints && breakpointsAdded < maxBreakpoints; i++) {
      const position = Math.min(interval * i, cacheableLength - 1)

      if (position > 0 && position < cached.length) {
        cached[position] = {
          ...cached[position],
          providerOptions: {
            anthropic: {
              cacheControl: { type: 'ephemeral' }
            }
          }
        }
        breakpointsAdded++
      }
    }
  }

  return cached
}

export function applyOpenAICaching(
  messages: CacheableMessage[],
  model: string
): {
  messages: CacheableMessage[]
  extraOptions?: Record<string, any>
} {
  const extraOptions: Record<string, any> = {}

  if (model.includes('gpt-5')) {
    extraOptions.cached_prompt_retention = '24h'
  }

  return {
    messages,
    extraOptions: Object.keys(extraOptions).length > 0 ? extraOptions : undefined
  }
}

export function applyGrokCaching(
  messages: CacheableMessage[]
): {
  messages: CacheableMessage[]
  extraOptions?: Record<string, any>
} {
  return {
    messages,
    extraOptions: undefined
  }
}

export function applyCaching(
  messages: CacheableMessage[],
  model: string
): {
  messages: CacheableMessage[]
  extraOptions?: Record<string, any>
} {
  const provider = detectProvider(model)

  switch (provider) {
    case 'claude':
      return {
        messages: applyClaudeCaching(messages)
      }

    case 'openai':
      return applyOpenAICaching(messages, model)

    case 'grok':
      // Grok: Automatic prompt caching with conversation ID header
      // Note: Conversation ID is set at provider level in getModel(), not here
      return applyGrokCaching(messages)

    case 'gemini':
      // Gemini: Implicit caching enabled automatically for 2.5+ models
      // Minimum 1024 tokens (Flash) or 2048 tokens (Pro) required
      // Provides 75% discount on cached tokens with no configuration
      return { messages }

    case 'deepseek':
      // DeepSeek: Automatic context caching on disk
      // Enabled by default, 90% discount on cache hits
      return { messages }

    default:
      return { messages }
  }
}

export function extractCacheMetrics(response: any, provider: ProviderType): {
  cacheCreationTokens?: number
  cacheReadTokens?: number
  cacheMissTokens?: number
} {
  if (!response?.usage) return {}

  switch (provider) {
    case 'claude':
      const cacheRead = response.usage.cache_read_input_tokens ||
                       response.usage.cacheReadInputTokens ||
                       response.usage.cachedInputTokens
      const cacheCreate = response.usage.cache_creation_input_tokens ||
                         response.usage.cacheCreationInputTokens

      return {
        cacheCreationTokens: cacheCreate,
        cacheReadTokens: cacheRead
      }

    case 'openai':
    case 'grok':
      const cachedTokens = response.usage?.cachedInputTokens ||
                          response.usage?.prompt_tokens_details?.cached_tokens ||
                          response.usage?.promptTokensDetails?.cachedTokens

      return {
        cacheReadTokens: cachedTokens
      }

    case 'deepseek':
      const deepseekCached = response.usage?.cachedInputTokens ||
                            response.usage?.prompt_cache_hit_tokens ||
                            response.usage?.promptCacheHitTokens
      const deepseekMiss = response.usage?.prompt_cache_miss_tokens ||
                          response.usage?.promptCacheMissTokens

      return {
        cacheReadTokens: deepseekCached,
        cacheMissTokens: deepseekMiss
      }

    case 'gemini':
      return {
        cacheReadTokens: response.usage_metadata?.cached_content_token_count
      }

    default:
      return {}
  }
}
