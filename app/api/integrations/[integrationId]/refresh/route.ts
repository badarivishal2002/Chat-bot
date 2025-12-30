import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { refreshAccessToken } from '@/lib/refresh-token'
import dbConnect from '@/lib/db'
import Integration from '@/models/Integration'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params

    // Verify ownership
    await dbConnect()
    const integration = await Integration.findOne({ integration_id: integrationId })

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    if (integration.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Refresh token
    const result = await refreshAccessToken(integrationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to refresh token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Token refreshed successfully',
      integration: {
        integration_id: result.integration.integration_id,
        type: result.integration.type,
        name: result.integration.name,
        enabled: result.integration.enabled
      }
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
