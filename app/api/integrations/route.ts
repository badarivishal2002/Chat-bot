import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Integration from '@/models/Integration'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

// GET /api/integrations - List user's integrations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const integrations = await Integration.find({
      user_id: session.user.id
    })
      .select('-credentials') // Don't send credentials to frontend
      .sort({ created_at: -1 })
      .lean()

    console.log(`🔌 [INTEGRATIONS] Found ${integrations.length} integrations for user ${session.user.id}`)

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('🔌 [INTEGRATIONS] Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST /api/integrations - Create new integration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, name, description, config, credentials } = body

    // Validate required fields
    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = [
      'filesystem',
      'github',
      'google-drive',
      'slack',
      'database',
      'web-search',
      'email',
      'calendar',
      'jira',
      'notion'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid integration type' },
        { status: 400 }
      )
    }

    await connectDB()

    const integration = await Integration.create({
      integration_id: nanoid(),
      user_id: session.user.id,
      type,
      name: name.trim(),
      description: description?.trim() || '',
      enabled: true,
      config: config || {},
      credentials: credentials || {}
    })

    console.log(`[INTEGRATIONS] Created ${type} integration: ${integration.integration_id}`)

    // Return without credentials
    const integrationData = integration.toObject()
    delete integrationData.credentials

    return NextResponse.json({ integration: integrationData }, { status: 201 })
  } catch (error) {
    console.error('🔌 [INTEGRATIONS] Error creating integration:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
