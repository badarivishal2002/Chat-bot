'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Briefcase,
  Book,
  PenTool,
  Heart,
  Plane,
  Palette,
  BarChart3,
  DollarSign,
  FolderOpen,
  ArrowLeft,
  MessageSquare,
  Trash2,
  Plus,
  PenSquare,
  FolderInput
} from 'lucide-react'
import { nanoid } from 'nanoid'

const CATEGORY_ICONS: Record<string, any> = {
  investing: DollarSign,
  homework: Book,
  writing: PenTool,
  health: Heart,
  travel: Plane,
  creative: Palette,
  work: Briefcase,
  analytics: BarChart3,
  custom: FolderOpen,
}

interface Project {
  _id: string
  project_id: string
  user_id: string
  name: string
  category: string
  customCategory?: string | null
  description: string
  chat_ids: string[]
  created_at: string
  updated_at: string
}

interface Chat {
  id?: string  // From API response
  chat_id?: string  // Fallback
  title: string
  created_at?: string
  updated_at?: string
  timestamp?: string  // From API response
  project_id?: string | null
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [project, setProject] = useState<Project | null>(null)
  const [projectChats, setProjectChats] = useState<Chat[]>([])
  const [allChats, setAllChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAvailableChats, setShowAvailableChats] = useState(false)

  const projectId = params.projectId as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && projectId) {
      fetchProjectDetails()
    }
  }, [status, projectId])

  const fetchProjectDetails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`)
      if (!projectRes.ok) {
        throw new Error('Project not found')
      }
      const projectData = await projectRes.json()
      setProject(projectData.project)

      console.log('📁 PROJECT DATA:', {
        name: projectData.project.name,
        chat_ids: projectData.project.chat_ids,
        chat_count: projectData.project.chat_ids.length
      })

      // Fetch all chats
      const chatsRes = await fetch('/api/chat/history')
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json()
        const allUserChats = chatsData.chats || []
        setAllChats(allUserChats)

        console.log('💬 ALL CHATS:', allUserChats.map((c: Chat) => ({
          id: c.id || c.chat_id,
          title: c.title,
          project_id: c.project_id
        })))

        // Filter chats in this project
        const inProject = allUserChats.filter((chat: Chat) => {
          const chatId = chat.id || chat.chat_id || ''
          const isInProject = projectData.project.chat_ids.includes(chatId)
          if (projectData.project.chat_ids.length > 0) {
            console.log(`🔍 Checking chat: ${chatId} (${chat.title})`, {
              'in project_chat_ids?': isInProject,
              'chat.project_id': chat.project_id,
              'expected project_id': projectData.project.project_id
            })
          }
          return isInProject
        })

        console.log('✅ MATCHED CHATS:', inProject.length, inProject.map((c: Chat) => ({ id: c.id || c.chat_id, title: c.title })))

        // Log mismatches
        if (projectData.project.chat_ids.length > 0 && inProject.length === 0) {
          console.error('⚠️ MISMATCH: Project has chat_ids but no chats matched!')
          console.error('Looking for chat_ids:', projectData.project.chat_ids)
          console.error('Available chat_ids:', allUserChats.map((c: Chat) => c.id || c.chat_id))
        }

        setProjectChats(inProject)
      } else {
        console.error('Failed to fetch chat history:', chatsRes.status)
      }
    } catch (err) {
      console.error('Error fetching project:', err)
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddChatToProject = async (chatId: string) => {
    if (!chatId) {
      console.error('No chat ID provided')
      alert('Error: No chat selected')
      return
    }

    // Check if chat is already in project (client-side check)
    if (project?.chat_ids.includes(chatId)) {
      alert('This chat is already in the project')
      return
    }

    console.log('Adding chat to project:', { chatId, projectId })

    try {
      const response = await fetch(`/api/projects/${projectId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId })
      })

      if (response.ok) {
        console.log('Chat added successfully')
        // Refresh project details
        await fetchProjectDetails()
        // Close the available chats dropdown
        setShowAvailableChats(false)
      } else {
        const data = await response.json()
        console.error('Failed to add chat:', data)
        alert(data.error || 'Failed to add chat to project')
      }
    } catch (error) {
      console.error('Error adding chat:', error)
      alert('Failed to add chat to project')
    }
  }

  const handleRemoveChatFromProject = async (chatId: string) => {
    if (!confirm('Remove this chat from the project?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/chats?chat_id=${chatId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        // Refresh project details
        await fetchProjectDetails()
      }
    } catch (error) {
      console.error('Error removing chat:', error)
      alert('Failed to remove chat from project')
    }
  }

  const handleNewChatInProject = async () => {
    try {
      // Create a new chat
      const newChatId = nanoid()

      // First, create the chat in history
      const historyRes = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: newChatId,
          title: 'New Chat'
        })
      })

      if (!historyRes.ok) {
        throw new Error('Failed to create chat')
      }

      // Then add it to the project
      const projectRes = await fetch(`/api/projects/${projectId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: newChatId })
      })

      if (projectRes.ok) {
        // Navigate to the new chat
        router.push(`/chat/${newChatId}`)
      } else {
        throw new Error('Failed to add chat to project')
      }
    } catch (error) {
      console.error('Error creating new chat:', error)
      alert('Failed to create new chat in project')
    }
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
  }

  // Get available chats (not in this project)
  const availableChats = allChats.filter(chat => {
    const chatId = chat.id || chat.chat_id || ''
    const isInProject = project?.chat_ids.includes(chatId)
    return !isInProject
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => router.push('/chat')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>
      </div>
    )
  }

  const Icon = CATEGORY_ICONS[project.category] || FolderOpen

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/chat')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{project.category}</span>
                <span>•</span>
                <span>{project.chat_ids.length} chats</span>
                <span>•</span>
                <span>
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              {project.description && (
                <p className="mt-2 text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={handleNewChatInProject}
            className="flex-1 sm:flex-none"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            New chat in project
          </Button>
          <Button
            onClick={() => setShowAvailableChats(!showAvailableChats)}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Add existing chat
          </Button>
        </div>

        {/* Available Chats (when adding existing) */}
        {showAvailableChats && (
          <div className="mb-6 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Available Chats</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAvailableChats(false)}
              >
                Close
              </Button>
            </div>

            {availableChats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available chats to add
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableChats.map((chat) => {
                  const chatId = chat.id || chat.chat_id || ''
                  return (
                    <div
                      key={chatId}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{chat.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {chat.timestamp || (chat.updated_at ? new Date(chat.updated_at).toLocaleDateString() : 'No date')}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddChatToProject(chatId)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Project Chats List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Chats in this project ({projectChats.length})
          </h2>

          {projectChats.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No chats in this project yet
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleNewChatInProject}>
                  <PenSquare className="h-4 w-4 mr-2" />
                  Start new chat
                </Button>
                {availableChats.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAvailableChats(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add existing chat
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {projectChats.map((chat) => {
                const chatId = chat.id || chat.chat_id || ''
                return (
                  <div
                    key={chatId}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <button
                      onClick={() => handleChatClick(chatId)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium">{chat.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {chat.timestamp || (chat.updated_at ? `${new Date(chat.updated_at).toLocaleDateString()} • Last updated ${new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No date')}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveChatFromProject(chatId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from project"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
