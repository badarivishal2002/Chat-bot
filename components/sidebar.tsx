"use client"

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ChatStorage } from '@/lib/chat-storage'
import {
  MessageSquare,
  Plus,
  Minus,
  Trash2,
  LogOut,
  Menu,
  Settings,
  Headphones,
  PenSquare,
  FolderPlus,
  FolderInput
} from 'lucide-react'
import { ProjectModal } from '@/components/project-modal'
import { ProjectList } from '@/components/project-list'
import { AddToProjectModal } from '@/components/add-to-project-modal'
import { SettingsModal } from '@/components/settings-modal'

interface ChatHistoryItem {
  id: string
  title: string
  timestamp: string
  preview?: string
}

interface SidebarProps {
  chatHistory: ChatHistoryItem[]
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onFilesUploaded?: () => void
  currentChatId?: string
  isLoadingHistory?: boolean
}


export function Sidebar({ chatHistory, onNewChat, onSelectChat, onDeleteChat, isCollapsed, onToggleCollapse, onFilesUploaded, currentChatId, isLoadingHistory = false }: SidebarProps) {
  const [isClient, setIsClient] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const { data: session } = useSession()
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [addToProjectChatId, setAddToProjectChatId] = useState<string | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const router = useRouter()
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.user) return

      setIsLoadingProjects(true)
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [session])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.account-menu-container')) {
        setShowAccountMenu(false)
        setShowProfileSettings(false)
      }
    }

    if (showAccountMenu || showProfileSettings) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showAccountMenu, showProfileSettings])

  const getUserDisplayName = (email: string) => {
    const username = email.split('@')[0]
    return username.length > 8 ? username.substring(0, 8) : username
  }

  const handleSignOut = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut({ callbackUrl: '/login' })
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }


  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId)
  }

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId)
    }
  }

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) {
      alert('Please enter a message')
      return
    }

    if (supportMessage.length > 500) {
      alert('Message must be 500 words or less')
      return
    }

    setIsSubmittingSupport(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: supportMessage,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
        }),
      })

      if (response.ok) {
        alert('Support message sent successfully!')
        setSupportMessage('')
        setIsHelpModalOpen(false)
      } else {
        alert('Failed to send support message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending support message:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmittingSupport(false)
    }
  }

  const handleCreateProject = async (project: any) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })

      if (response.ok) {
        const data = await response.json()
        setProjects([data.project, ...projects])
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProjects(projects.filter(p => p.project_id !== projectId))
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }


  if (isCollapsed) {
    return (
      <>
        <div className="flex h-full w-14 md:w-16 flex-col bg-white dark:bg-gray-900 border-r flex-shrink-0">
          <div className="p-2 border-b">
            <Button 
              onClick={onToggleCollapse}
              variant="ghost"
              size="icon"
              className="w-full h-10 sm:h-11"
            >
               <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1"></div>
          
          {/* Account Section - Collapsed - Clicking opens full sidebar */}
          <div className="border-t p-2">
            <div className="relative account-menu-container">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 sm:h-11"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                title={session?.user?.email ? getUserDisplayName(session.user.email) : 'Account'}
              >
                <span className="text-xs sm:text-sm font-semibold">U</span>
              </Button>
              
              {showAccountMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 min-w-40 z-50">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="sm:max-w-md max-w-[90vw] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Confirm Logout
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={cancelLogout}
                >
                  No
                </Button>
                <Button
                  onClick={confirmLogout}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Yes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (

    <div className="flex w-full sm:w-72 md:w-80 lg:w-80 flex-col bg-white dark:bg-gray-900 border-r flex-shrink-0" style={{ height: '100dvh' }}>

      {/* Header with Close button */}
      <div className="px-3 py-2 sm:px-4 sm:py-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat App</h1>
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={() => setIsProjectModalOpen(true)}
          className="w-full justify-start gap-2 h-10 sm:h-11 rounded-lg hover:bg-accent transition-colors mb-2"
          variant="outline"
        >
          <FolderPlus className="h-4 w-4" />
          <span className="text-sm sm:text-base">Create project</span>
        </Button>
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 h-10 sm:h-11 rounded-lg hover:bg-accent transition-colors"
          variant="outline"
        >
          <PenSquare className="h-4 w-4" />
          <span className="text-sm sm:text-base">New chat</span>
        </Button>
      </div>

      {/* Projects Section (collapsible) */}
      <div className="px-3 sm:px-4 pb-2 flex-shrink-0 border-b">
        <button
          type="button"
          onClick={() => setIsProjectsOpen((o) => !o)}
          className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground h-10"
          aria-expanded={isProjectsOpen}
          aria-controls="projects-content"
        >
          <span>Projects</span>
          <div className="flex items-center gap-1">
            <div
              onClick={(e) => {
                e.stopPropagation()
                setIsProjectModalOpen(true)
              }}
              className="p-1 hover:bg-muted rounded cursor-pointer"
              title="Create project"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsProjectModalOpen(true)
                }
              }}
            >
              <FolderPlus className="h-4 w-4" />
            </div>
            {isProjectsOpen ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </div>
        </button>

        {isProjectsOpen && (
          <div className="mt-2">
            {isLoadingProjects ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                Loading projects...
              </div>
            ) : (
              <ProjectList
                projects={projects}
                onSelectProject={handleSelectProject}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </div>
        )}
      </div>

      {/* Recents Section (collapsible) */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 mt-4">

        {chatHistory.length > 0 || isLoadingHistory ? (
          <>
            <div className="p-3 sm:p-4 pb-2 flex-shrink-0 border-b">
              <button
                type="button"
                onClick={() => setIsChatHistoryOpen((o) => !o)}
                className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground h-10"
                aria-expanded={isChatHistoryOpen}
                aria-controls="chat-history-content"
              >
                <span>Recents</span>
                {isChatHistoryOpen ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>

            {isChatHistoryOpen && (
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 min-h-0 sidebar-scroll transition-opacity duration-200"
              >
                <div className="space-y-1 pb-4">
                  {isLoadingHistory ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="w-full rounded-lg p-3 animate-pulse">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-muted rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded mb-1"></div>
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded w-1/2 mt-1 ml-6"></div>
                      </div>
                    ))
                  ) : chatHistory.length > 0 ? (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                        onTouchStart={() => setHoveredChatId(chat.id)}
                        onTouchEnd={() => setHoveredChatId(null)}
                        className={`w-full text-left rounded-lg p-3 text-sm transition-colors hover:bg-accent cursor-pointer ${
                          isClient && currentChatId === chat.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{chat.title}</div>
                          </div>
                          {hoveredChatId === chat.id && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setAddToProjectChatId(chat.id)
                                }}
                                title="Add to project"
                              >
                                <FolderInput className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                title="Delete chat"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 ml-6">
                          {chat.timestamp}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No recent chats yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 pb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Recents
            </h2>
          </div>
        )}
      </div>

      {/* Spacer - pushes account section to bottom when recents is collapsed */}
      {!isChatHistoryOpen && <div className="flex-1"></div>}

      {/* Account Section - Always at bottom */}
      <div className="border-t p-3 sm:p-4 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="relative account-menu-container">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start gap-2 h-auto py-2.5 min-h-[44px]"
                onClick={() => setShowProfileSettings(!showProfileSettings)}
              >
              <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
               <span className="text-sm font-semibold text-primary-foreground">
               {session?.user?.email 
               ? getUserDisplayName(session.user.email).charAt(0).toUpperCase(): 'U'}
              </span>
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full">{session?.user?.name || 'Account'}</span>
              </div>
              </Button>
              
            </div>
            
            {showProfileSettings && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50 min-w-48">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {session?.user?.email 
                          ? getUserDisplayName(session.user.email).charAt(0).toUpperCase()
                          : 'U'
                        }
                      </span>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-black dark:text-white">
                          {session?.user?.name || 'User'}
                        </div>
                    </div>
                    <div className="text-green-500">
                      ✓
                    </div>
                  </div>
                </div>
                
                {/* Menu Options */}
                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sm sm:text-base text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 px-3"
                    onClick={() => {
                      setIsSettingsModalOpen(true)
                      setShowProfileSettings(false)
                    }}
                  >
                    <Settings className="h-4 w-4 flex-shrink-0" />
                    Settings
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sm sm:text-base text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 px-3"
                    onClick={() => {
                      setIsHelpModalOpen(true)
                      setShowProfileSettings(false)
                    }}
                  >
                    <Headphones className="h-4 w-4 flex-shrink-0" />
                    Help & Support
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sm sm:text-base text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 px-3"
                    onClick={() => {
                      setShowProfileSettings(false)
                      handleSignOut()
                    }}
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Help & Support Modal */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Help & Support
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Message (max 500 characters)
              </label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                maxLength={500}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your issue or question..."
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {supportMessage.length}/500 characters
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsHelpModalOpen(false)}
                disabled={isSubmittingSupport}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSupportSubmit}
                disabled={isSubmittingSupport || !supportMessage.trim()}
                className="bg-blue-400 hover:bg-blue-500 text-white"
              >
                {isSubmittingSupport ? 'Sending...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md max-w-[90vw] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Confirm Logout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={cancelLogout}
              >
                No
              </Button>
              <Button
                onClick={confirmLogout}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Yes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Modal */}
      <ProjectModal
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        onCreateProject={handleCreateProject}
      />

      {/* Add to Project Modal */}
      {addToProjectChatId && (
        <AddToProjectModal
          open={!!addToProjectChatId}
          onOpenChange={(open) => !open && setAddToProjectChatId(null)}
          chatId={addToProjectChatId}
          onSuccess={() => {
            // Optionally refresh chat history here
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />

    </div>
  )
} 