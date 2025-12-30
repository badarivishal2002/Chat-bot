"use client"

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  language?: string
  children: string
  inline?: boolean
  showLineNumbers?: boolean
}

export function CodeBlock({ language, children, inline = false, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  // Inline code - simple styling
  if (inline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[0.9em] font-mono">
        {children}
      </code>
    )
  }

  // Detect language from className if not provided
  const detectedLang = language || 'text'

  // Get display name for language
  const getLanguageDisplayName = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'React JSX',
      ts: 'TypeScript',
      tsx: 'React TSX',
      py: 'Python',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      rb: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      php: 'PHP',
      swift: 'Swift',
      kotlin: 'Kotlin',
      sql: 'SQL',
      bash: 'Bash',
      sh: 'Shell',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      markdown: 'Markdown',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      diff: 'Diff',
      text: 'Plain Text'
    }
    return languageMap[lang.toLowerCase()] || lang.toUpperCase()
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-700 dark:border-gray-600 bg-[#1E1E1E]">
      {/* Header with language badge and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {getLanguageDisplayName(detectedLang)}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-all"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content with syntax highlighting */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={detectedLang}
          style={oneDark}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            background: '#1E1E1E',
            borderRadius: 0
          }}
          codeTagProps={{
            style: {
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace"
            }
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
