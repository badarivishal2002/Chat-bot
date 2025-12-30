import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Chat from '@/models/Chat'
import crypto from 'crypto'

// Generate a secure share token
function generateShareToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// POST /api/chat/[chatId]/share - Generate or get share link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔗 [SHARE] Session user:', session?.user?.id)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { chatId } = await params
    console.log('🔗 [SHARE] Looking for chat:', chatId)

    const chat = await Chat.findOne({ chat_id: chatId })
    console.log('🔗 [SHARE] Chat found:', { chatId, userId: chat?.user_id, sessionUserId: session.user.id })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Verify ownership
    if (chat.user_id !== session.user.id) {
      console.error('🔗 [SHARE] Ownership mismatch:', { chatUserId: chat.user_id, sessionUserId: session.user.id })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('🔗 [SHARE] Ownership verified')

    // If already shared, return existing token
    if (chat.isShared && chat.shareToken) {
      const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/chat/shared/${chat.shareToken}`
      return NextResponse.json({
        shareUrl,
        shareToken: chat.shareToken,
        isShared: true
      })
    }

    // Generate new share token
    const shareToken = generateShareToken()
    chat.isShared = true
    chat.shareToken = shareToken
    chat.sharedAt = new Date()
    await chat.save()

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/chat/shared/${shareToken}`

    return NextResponse.json({
      shareUrl,
      shareToken,
      isShared: true
    })
  } catch (error) {
    console.error('Error generating share link:', error)
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/[chatId]/share - Revoke share link
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { chatId } = await params
    const chat = await Chat.findOne({ chat_id: chatId })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Verify ownership
    if (chat.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Revoke sharing
    chat.isShared = false
    chat.shareToken = null
    chat.sharedAt = null
    await chat.save()

    return NextResponse.json({
      success: true,
      message: 'Share link revoked'
    })
  } catch (error) {
    console.error('Error revoking share link:', error)
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    )
  }
}
