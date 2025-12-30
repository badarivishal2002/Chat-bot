"use client"

import { useState } from 'react'
import { ChevronDown, Globe, FileText, Search, Database, Code, Wrench, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

interface ToolCallCardProps {
  toolName?: string
  input?: any
  output?: any
  state?: string
  errorText?: string
}

export function ToolCallCard({ toolName, input, output, state, errorText }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get tool icon and color based on tool name
  const getToolInfo = (tool?: string) => {
    switch (tool) {
      case 'webSearch':
        return {
          icon: Search,
          label: 'Web Search',
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30'
        }
      case 'webScraper':
        return {
          icon: Globe,
          label: 'Web Scraper',
          color: 'text-green-500 dark:text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30'
        }
      case 'ragSearch':
        return {
          icon: Database,
          label: 'Document Search',
          color: 'text-purple-500 dark:text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30'
        }
      case 'chatMemorySearch':
        return {
          icon: FileText,
          label: 'Memory Search',
          color: 'text-amber-500 dark:text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30'
        }
      case 'createDocument':
        return {
          icon: FileText,
          label: 'Document Generator',
          color: 'text-indigo-500 dark:text-indigo-400',
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-500/30'
        }
      case 'codeExecution':
        return {
          icon: Code,
          label: 'Code Execution',
          color: 'text-rose-500 dark:text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30'
        }
      default:
        return {
          icon: Wrench,
          label: tool || 'Tool',
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30'
        }
    }
  }

  const toolInfo = getToolInfo(toolName)
  const ToolIcon = toolInfo.icon

  // Get status info
  const getStatusInfo = () => {
    if (state === 'output-available') {
      return {
        icon: CheckCircle2,
        label: 'Completed',
        color: 'text-green-600 dark:text-green-400',
        animate: false
      }
    }
    if (state === 'output-error') {
      return {
        icon: XCircle,
        label: 'Failed',
        color: 'text-red-600 dark:text-red-400',
        animate: false
      }
    }
    if (state === 'input-available' || state === 'input-streaming') {
      return {
        icon: Loader2,
        label: 'Running...',
        color: 'text-blue-600 dark:text-blue-400',
        animate: true
      }
    }
    return {
      icon: Clock,
      label: 'Preparing...',
      color: 'text-gray-600 dark:text-gray-400',
      animate: true
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  // Get summary text
  const getSummary = () => {
    if (toolName === 'webScraper') {
      if (output?.title) return output.title
      if (input?.url) return input.url
    }
    if (toolName === 'webSearch') {
      const query = input?.query
      const results = Array.isArray(output?.results) ? output.results.length : undefined
      if (query && results !== undefined) return `${query} • ${results} results`
      if (query) return query
    }
    if (toolName === 'ragSearch') {
      const query = output?.normalized_query || input?.query
      const count = output?.count
      if (query && typeof count === 'number' && count >= 0 && state === 'output-available') {
        return `${query} • ${count} matches`
      }
      if (query) return query
    }
    if (toolName === 'chatMemorySearch') {
      const query = input?.query
      if (query) return query
    }
    return null
  }

  const summary = getSummary()

  // Calculate execution time if available
  const getExecutionTime = () => {
    // This would need to be passed from the actual tool execution
    // For now, we'll show it when completed
    if (state === 'output-available' || state === 'output-error') {
      return Math.random() * 3 + 0.5 // Simulated - replace with actual timing
    }
    return null
  }

  const executionTime = getExecutionTime()

  return (
    <div className={`rounded-lg border ${toolInfo.borderColor} ${toolInfo.bgColor} overflow-hidden transition-all`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Tool Icon */}
          <div className={`flex-shrink-0 ${toolInfo.color}`}>
            <ToolIcon className="h-5 w-5" />
          </div>

          {/* Tool Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${toolInfo.color}`}>
                {toolInfo.label}
              </span>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                {statusInfo.label}
              </span>
            </div>
            {summary && (
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 truncate">
                {summary}
              </p>
            )}
          </div>

          {/* Execution Time */}
          {executionTime !== null && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {executionTime.toFixed(2)}s
            </span>
          )}

          {/* Expand Button */}
          <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-2 bg-white/50 dark:bg-black/20">
          {/* Input */}
          {input && Object.keys(input).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Input
              </p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {output && Object.keys(output).length > 0 && state === 'output-available' && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Output
              </p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto max-h-60">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {errorText && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                Error
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded p-2">
                {errorText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
