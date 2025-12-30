'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Check
} from 'lucide-react'

interface AddToProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId: string
  currentProjectId?: string | null
  onSuccess?: () => void
}

interface Project {
  _id: string
  project_id: string
  name: string
  category: string
  customCategory?: string | null
  description: string
  chat_ids: string[]
}

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

export function AddToProjectModal({
  open,
  onOpenChange,
  chatId,
  currentProjectId,
  onSuccess
}: AddToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(currentProjectId || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchProjects()
      setSelectedProjectId(currentProjectId || null)
    }
  }, [open, currentProjectId])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToProject = async () => {
    if (!selectedProjectId) return

    setIsSubmitting(true)
    try {
      // First, remove from current project if exists
      if (currentProjectId && currentProjectId !== selectedProjectId) {
        await fetch(`/api/projects/${currentProjectId}/chats?chat_id=${chatId}`, {
          method: 'DELETE'
        })
      }

      // Add to selected project
      const response = await fetch(`/api/projects/${selectedProjectId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId })
      })

      if (response.ok) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add to project')
      }
    } catch (error) {
      console.error('Error adding to project:', error)
      alert('Failed to add to project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveFromProject = async () => {
    if (!currentProjectId) return

    if (!confirm('Remove this chat from the project?')) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/chats?chat_id=${chatId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSelectedProjectId(null)
        onSuccess?.()
        onOpenChange(false)
      } else {
        alert('Failed to remove from project')
      }
    } catch (error) {
      console.error('Error removing from project:', error)
      alert('Failed to remove from project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add to Project</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <p className="text-sm text-muted-foreground">
                Create a project first to organize your chats
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {projects.map((project) => {
                const Icon = CATEGORY_ICONS[project.category] || FolderOpen
                const isSelected = selectedProjectId === project.project_id
                const isCurrent = currentProjectId === project.project_id

                return (
                  <button
                    key={project.project_id}
                    onClick={() => setSelectedProjectId(project.project_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{project.name}</div>
                      <div className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {project.chat_ids.length} chats • {project.category}
                      </div>
                    </div>
                    {isCurrent && (
                      <div className={`text-xs px-2 py-1 rounded ${
                        isSelected ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'
                      }`}>
                        Current
                      </div>
                    )}
                    {isSelected && <Check className="h-5 w-5 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {currentProjectId && (
            <Button
              onClick={handleRemoveFromProject}
              disabled={isSubmitting}
              variant="destructive"
              className="flex-1"
            >
              Remove from project
            </Button>
          )}
          <Button
            onClick={handleAddToProject}
            disabled={!selectedProjectId || isSubmitting || selectedProjectId === currentProjectId}
            className="flex-1"
          >
            {isSubmitting ? 'Adding...' : 'Add to project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
