import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Integration from '@/models/Integration'

export const dynamic = 'force-dynamic'

// GET /api/integrations/:id - Get integration details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params
    await connectDB()

    const integration = await Integration.findOne({
      integration_id: integrationId,
      user_id: session.user.id
    })
      .select('-credentials')
      .lean()

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('🔌 [INTEGRATIONS] Error fetching integration:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/integrations/:id - Update integration
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params
    const body = await req.json()
    const { name, description, enabled, config, credentials } = body

    await connectDB()

    const integration = await Integration.findOne({
      integration_id: integrationId,
      user_id: session.user.id
    })

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) integration.name = name.trim()
    if (description !== undefined) integration.description = description.trim()
    if (enabled !== undefined) integration.enabled = enabled
    if (config !== undefined) integration.config = config
    if (credentials !== undefined) integration.credentials = credentials

    await integration.save()

    console.log(`🔌 [INTEGRATIONS] Updated integration: ${integrationId}`)

    // Return without credentials
    const integrationData = integration.toObject()
    delete integrationData.credentials

    return NextResponse.json({ integration: integrationData })
  } catch (error) {
    console.error('🔌 [INTEGRATIONS] Error updating integration:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/integrations/:id - Delete integration
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params
    await connectDB()

    const result = await Integration.deleteOne({
      integration_id: integrationId,
      user_id: session.user.id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    console.log(`🔌 [INTEGRATIONS] Deleted integration: ${integrationId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('🔌 [INTEGRATIONS] Error deleting integration:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
