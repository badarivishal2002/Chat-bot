import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// OAuth configuration for each integration type
const oauthConfig: Record<string, {
  authUrl: string
  clientId: string
  scope: string
  redirectUri: string
  additionalParams?: Record<string, string>
}> = {
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    scope: 'repo,read:user,read:org',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/github`
  },
  'google-drive': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/google-drive`
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    clientId: process.env.SLACK_OAUTH_CLIENT_ID || '',
    scope: 'channels:read,chat:write,files:read,users:read',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/slack`
  },
  email: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/email`
  },
  calendar: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/calendar`
  },
  jira: {
    authUrl: 'https://auth.atlassian.com/authorize',
    clientId: process.env.JIRA_OAUTH_CLIENT_ID || '',
    scope: 'read:jira-work read:jira-user write:jira-work manage:jira-project offline_access',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/jira`,
    additionalParams: {
      audience: 'api.atlassian.com'
    }
  },
  notion: {
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    clientId: process.env.NOTION_OAUTH_CLIENT_ID || '',
    scope: 'read_content',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/notion`
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await req.json()

    if (!type || !oauthConfig[type]) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 })
    }

    const config = oauthConfig[type]

    // Store state data for CSRF protection
    // Include user_id in the state and verify it in the callback
    const stateData = {
      userId: session.user.id,
      integrationType: type,
      timestamp: Date.now()
    }

    // Encode state data
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64')

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state: encodedState,
      response_type: 'code',
      access_type: 'offline', // For refresh tokens
      prompt: 'consent', // Force consent screen to get refresh token
      ...(config.additionalParams || {}) // Add any provider-specific params (e.g., audience for Jira)
    })

    const authUrl = `${config.authUrl}?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error initiating OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    )
  }
}
