'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Briefcase,
  Book,
  PenTool,
  Heart,
  Plane,
  Palette,
  BarChart3,
  DollarSign,
  FolderOpen
} from 'lucide-react'

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (project: {
    name: string
    category: string
    customCategory?: string
    description: string
  }) => Promise<void>
}

const CATEGORIES = [
  { id: 'investing', label: 'Investing', icon: DollarSign },
  { id: 'homework', label: 'Homework', icon: Book },
  { id: 'writing', label: 'Writing', icon: PenTool },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'custom', label: 'Custom', icon: FolderOpen },
]

export function ProjectModal({ open, onOpenChange, onCreateProject }: ProjectModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !category) {
      return
    }

    setIsCreating(true)
    try {
      await onCreateProject({
        name: name.trim(),
        category,
        customCategory: category === 'custom' ? customCategory.trim() : undefined,
        description: description.trim()
      })

      // Reset form
      setName('')
      setCategory('')
      setCustomCategory('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating project:', error)
      // You could show an error toast here
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create project</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Projects keep your conversations organized
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Name Input */}
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project name
            </label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      category === cat.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Category Input (shown when "Custom" is selected) */}
          {category === 'custom' && (
            <div className="space-y-2">
              <label htmlFor="custom-category" className="text-sm font-medium">
                Custom category name
              </label>
              <Input
                id="custom-category"
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Description Input (Optional) */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="description"
              placeholder="What's this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !category || isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
