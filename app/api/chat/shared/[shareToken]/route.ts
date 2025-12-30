import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Chat from '@/models/Chat'
import Message from '@/models/Message'

// GET /api/chat/shared/[shareToken] - Access shared chat (requires authentication)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    // Require authentication to view shared chats
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to view shared chats' },
        { status: 401 }
      )
    }

    await connectDB()

    const { shareToken } = await params

    // Find chat by share token
    const chat = await Chat.findOne({
      shareToken,
      isShared: true
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Shared chat not found or link has been revoked' },
        { status: 404 }
      )
    }

    // Fetch messages for the chat
    const messages = await Message.find({ chat_id: chat.chat_id })
      .sort({ timestamp: 1 })
      .limit(100) // Limit to last 100 messages
      .lean()

    return NextResponse.json({
      chat: {
        id: chat.chat_id,
        title: chat.title,
        created_at: chat.created_at,
        isShared: true,
        sharedBy: chat.user_id,
        messages: messages.map((msg: any) => ({
          id: msg._id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          edited: msg.edited,
          editedAt: msg.editedAt,
          sources: msg.sources || []
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching shared chat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared chat' },
      { status: 500 }
    )
  }
}
