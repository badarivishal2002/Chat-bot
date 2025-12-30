import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

// GET /api/projects - List all projects for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get all projects for the user, sorted by most recent first
    const projects = await Project.find({ user_id: session.user.id })
      .sort({ updated_at: -1 })
      .lean()

    console.log(`📁 [PROJECTS] Found ${projects.length} projects for user ${session.user.id}`)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('📁 [PROJECTS] Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, category, customCategory, description } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    await connectDB()

    // Create new project
    const project = await Project.create({
      project_id: nanoid(),
      user_id: session.user.id,
      name: name.trim(),
      category,
      customCategory: category === 'custom' ? customCategory?.trim() : null,
      description: description?.trim() || '',
      chat_ids: [],
      created_at: new Date(),
      updated_at: new Date()
    })

    console.log(`📁 [PROJECTS] Created new project: ${project.project_id} for user ${session.user.id}`)

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('📁 [PROJECTS] Error creating project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
