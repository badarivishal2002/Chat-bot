import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'
import Chat from '@/models/Chat'

export const dynamic = 'force-dynamic'

// POST /api/projects/[projectId]/chats - Add a chat to a project
export async function POST(
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
    const { chat_id } = body

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
    }

    await connectDB()

    // Verify project ownership
    const project = await Project.findOne({
      project_id: projectId,
      user_id: session.user.id
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify chat ownership
    const chat = await Chat.findOne({
      chat_id: chat_id,
      user_id: session.user.id
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Check if chat is already in project
    if (project.chat_ids.includes(chat_id)) {
      return NextResponse.json({ error: 'Chat already in project' }, { status: 400 })
    }

    // Add chat to project
    project.chat_ids.push(chat_id)
    project.updated_at = new Date()
    await project.save()

    // Update chat with project_id
    chat.project_id = projectId
    await chat.save()

    console.log(`📁 [PROJECTS] Added chat ${chat_id} to project ${projectId}`)

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('📁 [PROJECTS] Error adding chat to project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/chats - Remove a chat from a project
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
    const { searchParams } = new URL(req.url)
    const chat_id = searchParams.get('chat_id')

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
    }

    await connectDB()

    // Verify project ownership
    const project = await Project.findOne({
      project_id: projectId,
      user_id: session.user.id
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Remove chat from project
    const index = project.chat_ids.indexOf(chat_id)
    if (index === -1) {
      return NextResponse.json({ error: 'Chat not in project' }, { status: 400 })
    }

    project.chat_ids.splice(index, 1)
    project.updated_at = new Date()
    await project.save()

    // Remove project_id from chat
    const chat = await Chat.findOne({
      chat_id: chat_id,
      user_id: session.user.id
    })

    if (chat) {
      chat.project_id = null
      await chat.save()
    }

    console.log(`📁 [PROJECTS] Removed chat ${chat_id} from project ${projectId}`)

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('📁 [PROJECTS] Error removing chat from project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
