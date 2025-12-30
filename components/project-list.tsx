'use client'

import { useState } from 'react'
import { Folder, ChevronDown, ChevronRight, MoreVertical, Trash2, Edit2 } from 'lucide-react'
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

interface ProjectListProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  isCollapsed?: boolean
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

export function ProjectList({
  projects,
  onSelectProject,
  onDeleteProject,
  isCollapsed = false
}: ProjectListProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  const toggleExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  if (projects.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground text-center">
        No projects yet
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {projects.map((project) => {
        const Icon = CATEGORY_ICONS[project.category] || Folder
        const isExpanded = expandedProjects.has(project.project_id)

        return (
          <div
            key={project.project_id}
            className="group"
            onMouseEnter={() => setHoveredProject(project.project_id)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer transition-colors">
              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleExpand(project.project_id)}
                className="flex-shrink-0 hover:bg-background rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>

              {/* Project Icon & Name */}
              <button
                onClick={() => onSelectProject(project.project_id)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm truncate">{project.name}</span>
                {project.chat_ids.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({project.chat_ids.length})
                  </span>
                )}
              </button>

              {/* Actions Menu */}
              {hoveredProject === project.project_id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteProject(project.project_id)
                    }}
                    className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive"
                    title="Delete project"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Project Description (when expanded) */}
            {isExpanded && project.description && (
              <div className="ml-9 px-2 py-1 text-xs text-muted-foreground">
                {project.description}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
