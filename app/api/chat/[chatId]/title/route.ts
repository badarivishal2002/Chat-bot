import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Chat from '@/models/Chat'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    await connectDB()

    const chat = await Chat.findOne({ 
      chat_id: chatId, 
      user_id: session.user.id 
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      title: chat.title 
    })

  } catch (error) {
    console.error('[TITLE] Error retrieving chat title:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await req.json()
    const { chatId } = await params

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Valid title is required' }, { status: 400 })
    }

    await connectDB()

    const updatedChat = await Chat.findOneAndUpdate(
      { chat_id: chatId, user_id: session.user.id },
      { $set: { title: title.trim() } },
      { new: true }
    )

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    console.log('[TITLE] Chat title updated via API:', { chatId, title })

    return NextResponse.json({ 
      success: true, 
      title: updatedChat.title 
    })

  } catch (error) {
    console.error('[TITLE] Error updating chat title:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}