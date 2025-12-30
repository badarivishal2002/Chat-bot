"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  disabled?: boolean
}

const models = [
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Latest model - excels at complex coding & analysis',
    supportsImages: true,
    supportsPDF: true,
    supportsDocuments: false
  },
  {
    id: 'gpt-5',
    name: 'GPT-5.1',
    description: 'Most advanced OpenAI model with enhanced intelligence',
    supportsImages: true,
    supportsPDF: true,
    supportsDocuments: false
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Latest & most capable with internet search (Default)',
    supportsImages: true,
    supportsPDF: true,
    supportsDocuments: false // Office docs not supported in chat
  },
  {
    id: 'claude-4.5',
    name: 'Claude Sonnet 4.5',
    description: 'Latest & most advanced Claude model',
    supportsImages: true,
    supportsPDF: true,
    supportsDocuments: false // Office docs not supported in chat
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient',
    supportsImages: true,
    supportsPDF: true,
    supportsDocuments: false // Office docs not supported in chat
  },
  {
    id: 'grok-beta',
    name: 'Grok-4-1-fast-reasoning',
    description: 'xAI\'s latest model with real-time knowledge',
    supportsImages: true,
    supportsPDF: false,
    supportsDocuments: false
  },
  {
    id: 'deepseek-chat',
    name: 'Deepseek-chat',
    description: 'Advanced reasoning and coding capabilities (Text only)',
    supportsImages: false,
    supportsPDF: false,
    supportsDocuments: false
  }
]

// Helper function to check if a model supports images
export const modelSupportsImages = (modelId: string): boolean => {
  const model = models.find(m => m.id === modelId)
  return model?.supportsImages ?? false
}

// Helper function to check if a model supports PDF files
export const modelSupportsPDF = (modelId: string): boolean => {
  const model = models.find(m => m.id === modelId)
  return model?.supportsPDF ?? false
}

// Helper function to check if a model supports file attachments (images + PDFs + documents)
export const modelSupportsFiles = (modelId: string): boolean => {
  const model = models.find(m => m.id === modelId)
  return model?.supportsImages || model?.supportsPDF || model?.supportsDocuments || false
}

// Get accepted file types for a model
export const getAcceptedFileTypes = (modelId: string): string => {
  if (modelId === 'deepseek-chat') return ''
  if (modelId === 'grok-beta') return 'image/*'
  if (modelId === 'claude-4.5' || modelId === 'gemini') return 'image/*,.pdf,.txt'
  // GPT-4: images and PDFs only
  return 'image/*,.pdf'
}

// Get attach button tooltip for a model
export const getAttachTooltip = (modelId: string): string => {
  if (modelId === 'deepseek-chat') return 'File attachments not supported by Deepseek'
  if (modelId === 'grok-beta') return 'Attach images only (PDF not supported)'
  if (modelId === 'claude-4.5' || modelId === 'gemini') return 'Attach images, PDFs, or .txt files'
  return 'Attach images or PDFs. For other documents, use the upload button above.'
}

// Check if file has document extension
export const isDocumentFile = (filename: string): boolean => {
  const ext = filename.toLowerCase()
  return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc') ||
         ext.endsWith('.pptx') || ext.endsWith('.ppt') || ext.endsWith('.xlsx') || ext.endsWith('.xls')
}

export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedModelInfo = models.find(m => m.id === selectedModel) || models[0]

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl border border-input shrink-0 active:scale-95 transition-transform h-10 sm:h-11"
      >
        <span className="font-medium truncate max-w-[80px] sm:max-w-none">{selectedModelInfo.name}</span>
        <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-background border border-input rounded-lg shadow-lg z-20 w-[85vw] sm:w-72 md:w-80 max-w-sm">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-muted focus:outline-none focus:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg min-h-[44px] ${
                  selectedModel === model.id ? 'bg-muted' : ''
                }`}
              >
                <div className="font-medium text-sm sm:text-base">{model.name}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{model.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}