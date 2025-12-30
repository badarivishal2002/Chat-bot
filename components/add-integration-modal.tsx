"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  FolderOpen,
  Github,
  Cloud,
  MessageSquare,
  Database,
  Search,
  Mail,
  Calendar,
  Briefcase,
  FileText,
  Loader2
} from 'lucide-react'

interface AddIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface IntegrationType {
  id: string
  name: string
  description: string
  icon: any
  color: string
  authType: 'oauth' | 'manual'
}

const integrationTypes: IntegrationType[] = [
  {
    id: 'filesystem',
    name: 'File System',
    description: 'Access and manage local files',
    icon: FolderOpen,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    authType: 'manual'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect to GitHub repositories',
    icon: Github,
    color: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    authType: 'oauth'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Access Google Drive files',
    icon: Cloud,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    authType: 'oauth'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Integrate with Slack workspace',
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    authType: 'oauth'
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Connect to databases',
    icon: Database,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    authType: 'manual'
  },
  {
    id: 'web-search',
    name: 'SERP API',
    description: 'Web search via SERP API',
    icon: Search,
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    authType: 'manual'
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Connect email accounts',
    icon: Mail,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    authType: 'oauth'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Sync with calendar services',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    authType: 'oauth'
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Connect to Jira projects',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    authType: 'oauth'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access Notion workspaces',
    icon: FileText,
    color: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    authType: 'oauth'
  }
]

export function AddIntegrationModal({ open, onOpenChange, onSuccess }: AddIntegrationModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleConnect = async (integration: IntegrationType) => {
    setLoading(integration.id)

    try {
      if (integration.authType === 'oauth') {
        // Initiate OAuth flow
        const response = await fetch('/api/integrations/auth/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: integration.id })
        })

        if (!response.ok) {
          throw new Error('Failed to initiate authentication')
        }

        const data = await response.json()

        // Open OAuth popup
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const popup = window.open(
          data.authUrl,
          `${integration.name} Authentication`,
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        )

        // Listen for OAuth callback
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'oauth-success' && event.data.integrationId === integration.id) {
            window.removeEventListener('message', handleMessage)
            setLoading(null)
            onSuccess()
            onOpenChange(false)
          } else if (event.data.type === 'oauth-error') {
            window.removeEventListener('message', handleMessage)
            setLoading(null)
            alert('Authentication failed. Please try again.')
          }
        }

        window.addEventListener('message', handleMessage)

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            setLoading(null)
          }
        }, 1000)
      } else {
        // Manual configuration (for filesystem, database)
        alert(`Manual configuration for ${integration.name} coming soon!`)
        setLoading(null)
      }
    } catch (error) {
      console.error('Error connecting integration:', error)
      alert('Failed to connect. Please try again.')
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Integration</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Connect your favorite apps and services with one click
          </p>
        </DialogHeader>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {integrationTypes.map((integration) => {
            const Icon = integration.icon
            const isLoading = loading === integration.id

            return (
              <button
                key={integration.id}
                onClick={() => handleConnect(integration)}
                disabled={isLoading}
                className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${integration.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  {isLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <Icon className="h-7 w-7" />
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-sm text-center text-gray-900 dark:text-gray-100 mb-1">
                  {integration.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 line-clamp-2">
                  {integration.description}
                </p>

                {/* OAuth Badge */}
                {integration.authType === 'oauth' && (
                  <div className="absolute top-2 right-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    OAuth
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Secure Authentication:</strong> We use OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
