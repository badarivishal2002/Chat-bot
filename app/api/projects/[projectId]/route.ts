import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'

export const dynamic = 'force-dynamic'

// GET /api/projects/[projectId] - Get a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    await connectDB()

    const project = await Project.findOne({
      project_id: projectId,
      user_id: session.user.id
    }).lean()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(`📁 [PROJECTS] Retrieved project: ${projectId}`)

    return NextResponse.json({ project })
  } catch (error) {
    console.error('📁 [PROJECTS] Error fetching project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/projects/[projectId] - Update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await req.json()
    const { name, category, customCategory, description } = body

    await connectDB()

    // Find project and verify ownership
    const project = await Project.findOne({
      project_id: projectId,
      user_id: session.user.id
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) project.name = name.trim()
    if (category !== undefined) project.category = category
    if (customCategory !== undefined) {
      project.customCategory = category === 'custom' ? customCategory?.trim() : null
    }
    if (description !== undefined) project.description = description.trim()

    project.updated_at = new Date()

    await project.save()

    console.log(`📁 [PROJECTS] Updated project: ${projectId}`)

    return NextResponse.json({ project })
  } catch (error) {
    console.error('📁 [PROJECTS] Error updating project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    await connectDB()

    // Delete project and verify ownership
    const result = await Project.deleteOne({
      project_id: projectId,
      user_id: session.user.id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(`📁 [PROJECTS] Deleted project: ${projectId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('📁 [PROJECTS] Error deleting project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
