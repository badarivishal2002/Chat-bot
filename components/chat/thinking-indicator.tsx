"use client"

import { Search, Cpu, FileText, Sparkles } from 'lucide-react'

interface ThinkingIndicatorProps {
  stage?: 'analyzing' | 'searching' | 'processing' | 'generating'
  message?: string
}

export function ThinkingIndicator({ stage = 'processing', message }: ThinkingIndicatorProps) {
  const stages = {
    analyzing: {
      icon: Sparkles,
      text: message || 'Analyzing your question...',
      color: 'text-purple-600 dark:text-purple-400'
    },
    searching: {
      icon: Search,
      text: message || 'Researching...',
      color: 'text-blue-600 dark:text-blue-400'
    },
    processing: {
      icon: Cpu,
      text: message || 'Processing...',
      color: 'text-green-600 dark:text-green-400'
    },
    generating: {
      icon: FileText,
      text: message || 'Writing response...',
      color: 'text-orange-600 dark:text-orange-400'
    }
  }

  const currentStage = stages[stage]
  const Icon = currentStage.icon

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
      <Icon className={`h-4 w-4 animate-pulse ${currentStage.color}`} />
      <span>{currentStage.text}</span>
      <div className="flex gap-1 ml-1">
        <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
