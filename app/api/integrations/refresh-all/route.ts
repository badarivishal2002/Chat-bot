import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { refreshUserTokens } from '@/lib/refresh-token'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔄 Refreshing all tokens for user: ${session.user.id}`)

    const result = await refreshUserTokens(session.user.id)

    return NextResponse.json({
      message: 'Token refresh complete',
      refreshed: result.refreshed,
      failed: result.failed
    })
  } catch (error) {
    console.error('Error refreshing user tokens:', error)
    return NextResponse.json(
      { error: 'Failed to refresh tokens' },
      { status: 500 }
    )
  }
}
