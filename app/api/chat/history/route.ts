import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Chat from '@/models/Chat'
import Message from '@/models/Message'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Optimized: Get chats with lean() for better performance
    const chats = await Chat.find(
      { user_id: session.user.id }
    )
    .select('chat_id title updated_at created_at')
    .sort({ updated_at: -1 })
    .limit(50) // Limit to 50 most recent chats for performance
    .lean() // Returns plain objects, much faster

    // Optimized: Use aggregation to get message stats in one query instead of N queries
    const chatIds = chats.map(c => c.chat_id)
    const messageStats = await Message.aggregate([
      {
        $match: {
          chat_id: { $in: chatIds },
          user_id: session.user.id
        }
      },
      {
        $group: {
          _id: '$chat_id',
          lastMessage: { $first: '$content' }, // $first gets first doc per group
          messageCount: { $sum: 1 }
        }
      }
    ])
    // Note: Removed $sort stage - unnecessary overhead before $group
    // MongoDB will use index on { chat_id: 1, timestamp: -1 } for efficient $first

    // Create a map for quick lookup
    const statsMap = new Map(
      messageStats.map(stat => [stat._id, stat])
    )

    // Format chats with stats
    const formattedChats = chats.map((chat) => {
      const stats = statsMap.get(chat.chat_id)
      return {
        id: chat.chat_id,
        title: chat.title,
        timestamp: formatTimestamp(chat.updated_at),
        lastMessage: (stats?.lastMessage || '').slice(0, 16),
        messageCount: stats?.messageCount || 0
      }
    })

    return NextResponse.json({ chats: formattedChats })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, title } = await req.json()
    
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    await connectDB()

    const newChat = new Chat({
      chat_id: chatId,
      user_id: session.user.id,
      title: title || 'New Chat'
    })

    await newChat.save()
    
    
    return NextResponse.json({ 
      success: true, 
      chat: {
        id: newChat.chat_id,
        title: newChat.title,
        timestamp: 'Just now',
        lastMessage: '',
        messageCount: 0
      }
    })
  } catch (error: any) {
    console.error('[CREATE] Error creating chat:', error)
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Chat already exists' }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}