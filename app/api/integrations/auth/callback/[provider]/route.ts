import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import dbConnect from '@/lib/db'
import Integration from '@/models/Integration'

// OAuth token exchange configuration
const tokenConfig: Record<string, {
  tokenUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
}> = {
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/github`
  },
  'google-drive': {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/google-drive`
  },
  slack: {
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: process.env.SLACK_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.SLACK_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/slack`
  },
  email: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/email`
  },
  calendar: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/calendar`
  },
  jira: {
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    clientId: process.env.JIRA_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.JIRA_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/jira`
  },
  notion: {
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    clientId: process.env.NOTION_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.NOTION_OAUTH_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/auth/callback/notion`
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return new NextResponse(
        `<html><body><script>
          window.opener.postMessage({ type: 'oauth-error', error: '${error}' }, '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    if (!code || !state) {
      return new NextResponse(
        `<html><body><script>
          window.opener.postMessage({ type: 'oauth-error', error: 'Missing code or state' }, '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Decode and verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    const { userId, integrationType, timestamp } = stateData

    // Verify state is not expired (15 minutes)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return new NextResponse(
        `<html><body><script>
          window.opener.postMessage({ type: 'oauth-error', error: 'State expired' }, '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Get token configuration
    const config = tokenConfig[provider]
    if (!config) {
      return new NextResponse(
        `<html><body><script>
          window.opener.postMessage({ type: 'oauth-error', error: 'Invalid provider' }, '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new NextResponse(
        `<html><body><script>
          window.opener.postMessage({ type: 'oauth-error', error: 'Token exchange failed' }, '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const tokenData = await tokenResponse.json()

    // Get user info from provider
    let userInfo: any = {}
    try {
      userInfo = await getUserInfo(provider, tokenData.access_token)
    } catch (error) {
      console.error('Error fetching user info:', error)
    }

    // Save integration to database
    await dbConnect()

    const integration = await Integration.create({
      integration_id: nanoid(),
      user_id: userId,
      type: integrationType,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} - ${userInfo.email || userInfo.name || 'Account'}`,
      description: `Connected via OAuth on ${new Date().toLocaleDateString()}`,
      enabled: true,
      config: {
        provider,
        userEmail: userInfo.email,
        userName: userInfo.name
      },
      credentials: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
        token_type: tokenData.token_type
      }
    })

    console.log('✅ Integration created:', integration.integration_id)

    // Close popup and notify parent window
    return new NextResponse(
      `<html><body><script>
        window.opener.postMessage({
          type: 'oauth-success',
          integrationId: '${integrationType}',
          data: ${JSON.stringify({ id: integration.integration_id, name: integration.name })}
        }, '*');
        window.close();
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return new NextResponse(
      `<html><body><script>
        window.opener.postMessage({ type: 'oauth-error', error: 'Server error' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// Helper function to get user info from different providers
async function getUserInfo(provider: string, accessToken: string): Promise<any> {
  switch (provider) {
    case 'github':
      const githubResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return githubResponse.json()

    case 'google-drive':
    case 'email':
    case 'calendar':
    case 'web-search':
      const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return googleResponse.json()

    case 'slack':
      const slackResponse = await fetch('https://slack.com/api/users.identity', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const slackData = await slackResponse.json()
      return slackData.user || {}

    case 'jira':
      const jiraResponse = await fetch('https://api.atlassian.com/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return jiraResponse.json()

    case 'notion':
      const notionResponse = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28'
        }
      })
      return notionResponse.json()

    default:
      return {}
  }
}
