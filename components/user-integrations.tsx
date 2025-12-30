"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plug, Trash2, Power, PowerOff, Loader2, Check } from 'lucide-react'
import {
  GitBranch,
  Cloud,
  MessageSquare,
  Mail,
  Calendar,
  Briefcase,
  FileText
} from 'lucide-react'

interface Integration {
  integration_id: string
  type: string
  name: string
  enabled: boolean
  config?: Record<string, any>
  created_at?: string
}

interface AvailableIntegration {
  id: string
  name: string
  description: string
  icon: any
  color: string
  authType: 'oauth' | 'manual'
}

const availableIntegrations: AvailableIntegration[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect to GitHub repositories',
    icon: GitBranch,
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
    id: 'email',
    name: 'Gmail',
    description: 'Connect email accounts',
    icon: Mail,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    authType: 'oauth'
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Sync with calendar services',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
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

export function UserIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/integrations')
      if (!response.ok) throw new Error('Failed to fetch integrations')
      const data = await response.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async (integration: AvailableIntegration) => {
    setConnectingId(integration.id)

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
            setConnectingId(null)
            setSuccessId(integration.id)

            // Show success for 2 seconds
            setTimeout(() => setSuccessId(null), 2000)

            // Refresh integrations list
            fetchIntegrations()
          } else if (event.data.type === 'oauth-error') {
            window.removeEventListener('message', handleMessage)
            setConnectingId(null)
            console.error('Authentication failed')
          }
        }

        window.addEventListener('message', handleMessage)

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            setConnectingId(null)
          }
        }, 1000)
      } else {
        // Manual configuration
        setConnectingId(null)
        alert(`Manual configuration for ${integration.name} coming soon!`)
      }
    } catch (error) {
      console.error('Error connecting integration:', error)
      setConnectingId(null)
    }
  }

  const toggleIntegration = async (integrationId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      })

      if (!response.ok) throw new Error('Failed to update integration')

      setIntegrations(prev =>
        prev.map(integration =>
          integration.integration_id === integrationId
            ? { ...integration, enabled: !currentEnabled }
            : integration
        )
      )
    } catch (error) {
      console.error('Error toggling integration:', error)
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete integration')

      setIntegrations(prev => prev.filter(integration => integration.integration_id !== integrationId))
    } catch (error) {
      console.error('Error deleting integration:', error)
    }
  }

  const isIntegrationConnected = (integrationId: string) => {
    return integrations.some(int => int.type === integrationId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plug className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Integrations
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Connect external tools and services via Model Context Protocol (MCP)
        </p>
      </div>

      {/* Available Integrations Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Available Integrations
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableIntegrations.map((integration) => {
            const Icon = integration.icon
            const isConnected = isIntegrationConnected(integration.id)
            const isConnecting = connectingId === integration.id
            const showSuccess = successId === integration.id

            return (
              <button
                key={integration.id}
                onClick={() => !isConnected && !isConnecting && handleConnect(integration)}
                disabled={isConnected || isConnecting}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-xl border-2
                  transition-all duration-200
                  ${isConnected
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg'
                  }
                  ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Connected Badge */}
                {isConnected && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center mb-2 transition-transform duration-200 ${!isConnected && !isConnecting ? 'group-hover:scale-110' : ''}`}>
                  {isConnecting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : showSuccess ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-xs text-center text-gray-900 dark:text-gray-100">
                  {integration.name}
                </h3>

                {/* Status */}
                {isConnecting && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Connecting...
                  </p>
                )}
                {showSuccess && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Connected!
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Connected Integrations List */}
      {integrations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Your Connected Integrations ({integrations.length})
          </h4>
          <div className="space-y-3">
            {integrations.map((integration) => {
              const availableIntegration = availableIntegrations.find(ai => ai.id === integration.type)
              const Icon = availableIntegration?.icon || Plug

              return (
                <div
                  key={integration.integration_id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${availableIntegration?.color || 'bg-gray-100'} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {integration.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {availableIntegration?.description || integration.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Button */}
                    <Button
                      onClick={() => toggleIntegration(integration.integration_id, integration.enabled)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {integration.enabled ? (
                        <>
                          <Power className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Disabled</span>
                        </>
                      )}
                    </Button>

                    {/* Delete Button */}
                    <Button
                      onClick={() => deleteIntegration(integration.integration_id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          What is MCP?
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Model Context Protocol (MCP) is an open protocol that enables seamless integration between AI applications and external data sources. Connect your databases, APIs, and tools to give your AI assistant more context and capabilities.
        </p>
      </div>
    </div>
  )
}
