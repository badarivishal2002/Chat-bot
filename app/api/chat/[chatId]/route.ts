import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Chat from '@/models/Chat'
import Message from '@/models/Message'
import { getLatestMessages } from '@/lib/chat-service'

export const dynamic = 'force-dynamic'

export async function GET(
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

    // Get the last 15 messages from the separate Message collection
    const messages = await getLatestMessages(chatId, session.user.id, 15)

    return NextResponse.json({ 
      chat: {
        id: chat.chat_id,
        title: chat.title,
        messages: messages,
        created_at: chat.created_at,
        updated_at: chat.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const { title } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    await connectDB()

    const updatedChat = await Chat.findOneAndUpdate(
      {
        chat_id: chatId,
        user_id: session.user.id
      },
      { 
        $set: { title, updated_at: new Date() }
      },
      { new: true }
    )

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      chat: {
        id: updatedChat.chat_id,
        title: updatedChat.title,
        updated_at: updatedChat.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST method removed - messages are now handled through the main chat API

export async function DELETE(
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

    // Check if chat exists and belongs to user
    const chat = await Chat.findOne({
      chat_id: chatId,
      user_id: session.user.id
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Delete all messages for this chat
    await Message.deleteMany({
      chat_id: chatId,
      user_id: session.user.id
    })

    // Delete the chat
    await Chat.findOneAndDelete({
      chat_id: chatId,
      user_id: session.user.id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}