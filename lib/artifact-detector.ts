import { Artifact } from '@/components/artifact-panel'

/**
 * Detects if a message contains code that should be shown as an artifact
 */
export function detectArtifact(messageText: string): Artifact | null {
  // Match code blocks with language annotation
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g
  const matches = Array.from(messageText.matchAll(codeBlockRegex))

  if (matches.length === 0) return null

  // Look for the first substantial code block
  for (const match of matches) {
    const language = match[1] || 'text'
    const content = match[2].trim()

    // Skip very small code blocks (likely examples)
    if (content.split('\n').length < 5) continue

    // Detect artifact type based on language and content
    const type = detectArtifactType(language, content)

    // Only create artifacts for certain types
    if (shouldCreateArtifact(type, content)) {
      return {
        id: generateArtifactId(),
        type,
        title: generateTitle(type, content),
        content,
        language,
        description: generateDescription(type)
      }
    }
  }

  return null
}

function detectArtifactType(language: string, content: string): Artifact['type'] {
  const lowerLang = language.toLowerCase()

  // HTML detection
  if (lowerLang === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) {
    return 'html'
  }

  // React/JSX detection
  if (lowerLang === 'jsx' || lowerLang === 'tsx' ||
      content.includes('import React') ||
      content.includes('export default') ||
      /function \w+\([^)]*\)\s*{[\s\S]*return\s*\([\s\S]*</.test(content)) {
    return 'react'
  }

  // SVG detection
  if (lowerLang === 'svg' || content.trim().startsWith('<svg')) {
    return 'svg'
  }

  // Mermaid diagram detection
  if (lowerLang === 'mermaid') {
    return 'mermaid'
  }

  // Default to code
  return 'code'
}

function shouldCreateArtifact(type: Artifact['type'], content: string): boolean {
  // Create artifacts for HTML, React, SVG (interactive/visual types)
  if (type === 'html' || type === 'react' || type === 'svg') {
    return true
  }

  // Create artifacts for longer code blocks (50+ lines)
  if (type === 'code' && content.split('\n').length >= 50) {
    return true
  }

  return false
}

function generateTitle(type: Artifact['type'], content: string): string {
  // Try to extract component name from React code
  if (type === 'react') {
    const componentMatch = content.match(/(?:function|const)\s+(\w+)/);
    if (componentMatch) {
      return `${componentMatch[1]} Component`
    }
    return 'React Component'
  }

  // Try to extract title from HTML
  if (type === 'html') {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/)
    if (titleMatch) {
      return titleMatch[1]
    }
    return 'HTML Document'
  }

  if (type === 'svg') {
    return 'SVG Graphic'
  }

  if (type === 'mermaid') {
    return 'Diagram'
  }

  return 'Code'
}

function generateDescription(type: Artifact['type']): string {
  const descriptions: Record<Artifact['type'], string> = {
    html: 'Interactive HTML document with live preview',
    react: 'React component code',
    svg: 'Scalable vector graphic',
    mermaid: 'Diagram visualization',
    code: 'Code snippet',
    chart: 'Chart visualization'
  }

  return descriptions[type] || 'Code artifact'
}

function generateArtifactId(): string {
  return `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
