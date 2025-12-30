import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import { getMessages, deleteMessagesAfter } from '@/lib/chat-service'

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
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '15')
    const before = searchParams.get('before')

    await connectDB()

    const beforeDate = before ? new Date(before) : undefined
    const messages = await getMessages(chatId, session.user.id, limit, beforeDate)

    return NextResponse.json({ 
      messages,
      hasMore: messages.length === limit // If we got the full limit, there might be more
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { searchParams } = new URL(req.url)
    const afterMessageId = searchParams.get('afterMessageId')

    if (!afterMessageId) {
      return NextResponse.json({ error: 'afterMessageId is required' }, { status: 400 })
    }

    await connectDB()

    const deletedCount = await deleteMessagesAfter(chatId, session.user.id, afterMessageId)

    console.log(`🗑️ Deleted ${deletedCount} messages after ${afterMessageId} in chat ${chatId}`)

    return NextResponse.json({
      success: true,
      deletedCount
    })
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}