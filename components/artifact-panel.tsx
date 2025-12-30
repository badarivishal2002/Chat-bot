"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Download, Copy, Code, Eye, Edit3, Maximize2, Minimize2 } from 'lucide-react'
import { CodeBlock } from './code-block'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ArtifactPanelProps {
  isOpen: boolean
  onClose: () => void
  artifact: Artifact | null
}

export interface Artifact {
  id: string
  type: 'code' | 'html' | 'react' | 'svg' | 'mermaid' | 'chart'
  title: string
  content: string
  language?: string
  description?: string
}

export function ArtifactPanel({ isOpen, onClose, artifact }: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (artifact) {
      setEditedContent(artifact.content)
      // Default to preview for previewable types, code for others
      if (artifact.type === 'html' || artifact.type === 'react' || artifact.type === 'svg') {
        setActiveTab('preview')
      } else {
        setActiveTab('code')
      }
    }
  }, [artifact])

  if (!isOpen || !artifact) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      code: artifact.language || 'txt',
      html: 'html',
      react: 'jsx',
      svg: 'svg',
      mermaid: 'mmd',
      chart: 'json'
    }

    const ext = extensions[artifact.type] || 'txt'
    const blob = new Blob([artifact.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.replace(/\s+/g, '_')}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderPreview = () => {
    if (artifact.type === 'html') {
      return (
        <iframe
          ref={iframeRef}
          srcDoc={`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    margin: 0;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                </style>
              </head>
              <body>
                ${isEditing ? editedContent : artifact.content}
              </body>
            </html>
          `}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts"
        />
      )
    }

    if (artifact.type === 'svg') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <div
            dangerouslySetInnerHTML={{ __html: isEditing ? editedContent : artifact.content }}
            className="max-w-full max-h-full"
          />
        </div>
      )
    }

    if (artifact.type === 'react') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <div className="text-center">
            <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              React component preview is not available in this environment.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              View the code in the "Code" tab and copy to your project.
            </p>
          </div>
        </div>
      )
    }

    // Default: show code
    return (
      <div className="w-full h-full overflow-auto bg-[#1E1E1E] p-4">
        <SyntaxHighlighter
          language={artifact.language || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            background: 'transparent',
            fontSize: '14px'
          }}
        >
          {isEditing ? editedContent : artifact.content}
        </SyntaxHighlighter>
      </div>
    )
  }

  const renderCodeEditor = () => {
    if (isEditing) {
      return (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-full bg-[#1E1E1E] text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none"
          spellCheck={false}
        />
      )
    }

    return (
      <div className="w-full h-full overflow-auto">
        <SyntaxHighlighter
          language={artifact.language || 'text'}
          style={oneDark}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '14px',
            height: '100%'
          }}
        >
          {artifact.content}
        </SyntaxHighlighter>
      </div>
    )
  }

  const canPreview = artifact.type === 'html' || artifact.type === 'svg' || artifact.type === 'react'

  return (
    <div
      className={`fixed inset-y-0 right-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 transition-all duration-300 ${
        isFullscreen ? 'left-0' : 'left-auto w-full md:w-2/3 lg:w-1/2'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {artifact.title}
          </h3>
          {artifact.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {artifact.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* Tabs */}
          {canPreview && (
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Eye className="h-3.5 w-3.5 inline mr-1" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'code'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Code className="h-3.5 w-3.5 inline mr-1" />
                Code
              </button>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isEditing ? 'Stop editing' : 'Edit'}
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy code"
          >
            <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-60px)] overflow-hidden">
        {activeTab === 'preview' && canPreview ? renderPreview() : renderCodeEditor()}
      </div>

      {/* Editing indicator */}
      {isEditing && (
        <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium">
          Editing mode • Changes are temporary
        </div>
      )}
    </div>
  )
}
