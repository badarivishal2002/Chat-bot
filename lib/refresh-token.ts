import Integration from '@/models/Integration'
import dbConnect from '@/lib/db'

interface TokenRefreshConfig {
  tokenUrl: string
  clientId: string
  clientSecret: string
}

const refreshConfigs: Record<string, TokenRefreshConfig> = {
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || ''
  },
  'google-drive': {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || ''
  },
  email: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || ''
  },
  calendar: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || ''
  },
  slack: {
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: process.env.SLACK_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.SLACK_OAUTH_CLIENT_SECRET || ''
  },
  jira: {
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    clientId: process.env.JIRA_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.JIRA_OAUTH_CLIENT_SECRET || ''
  },
  notion: {
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    clientId: process.env.NOTION_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.NOTION_OAUTH_CLIENT_SECRET || ''
  }
}

/**
 * Refresh an expired OAuth access token
 * @param integrationId - The integration ID to refresh
 * @returns Updated integration with new tokens
 */
export async function refreshAccessToken(integrationId: string) {
  try {
    await dbConnect()

    // Get integration from database
    const integration = await Integration.findOne({ integration_id: integrationId })
    if (!integration) {
      throw new Error('Integration not found')
    }

    const refreshToken = integration.credentials.get('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const config = refreshConfigs[integration.type]
    if (!config) {
      throw new Error(`No refresh config for type: ${integration.type}`)
    }

    console.log(`🔄 Refreshing token for ${integration.type} integration...`)

    // Request new access token
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', errorText)
      throw new Error('Failed to refresh token')
    }

    const tokenData = await response.json()

    // Update integration with new tokens
    integration.credentials.set('access_token', tokenData.access_token)

    // Some providers return a new refresh token
    if (tokenData.refresh_token) {
      integration.credentials.set('refresh_token', tokenData.refresh_token)
    }

    // Update expiry time
    if (tokenData.expires_in) {
      const expiresAt = Date.now() + tokenData.expires_in * 1000
      integration.credentials.set('expires_at', expiresAt.toString())
    }

    integration.updated_at = new Date()
    await integration.save()

    console.log(`✅ Token refreshed successfully for ${integration.type}`)

    return {
      success: true,
      integration
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a token needs to be refreshed (expires in less than 5 minutes)
 * @param integration - The integration to check
 * @returns True if token needs refresh
 */
export function needsTokenRefresh(integration: any): boolean {
  const expiresAt = integration.credentials.get('expires_at')
  if (!expiresAt) return false

  const expiryTime = parseInt(expiresAt)
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  // Refresh if token expires in less than 5 minutes
  return expiryTime - now < fiveMinutes
}

/**
 * Get a valid access token for an integration (refreshes if needed)
 * @param integrationId - The integration ID
 * @returns Valid access token
 */
export async function getValidAccessToken(integrationId: string): Promise<string> {
  await dbConnect()

  let integration = await Integration.findOne({ integration_id: integrationId })
  if (!integration) {
    throw new Error('Integration not found')
  }

  // Check if token needs refresh
  if (needsTokenRefresh(integration)) {
    console.log(`🔄 Token needs refresh for ${integration.type}`)
    const result = await refreshAccessToken(integrationId)

    if (!result.success) {
      throw new Error('Failed to refresh token')
    }

    integration = result.integration
  }

  const accessToken = integration.credentials.get('access_token')
  if (!accessToken) {
    throw new Error('No access token available')
  }

  return accessToken
}

/**
 * Refresh all expired tokens for a user
 * @param userId - The user ID
 */
export async function refreshUserTokens(userId: string) {
  await dbConnect()

  const integrations = await Integration.find({
    user_id: userId,
    enabled: true
  })

  const refreshPromises = integrations
    .filter(integration => needsTokenRefresh(integration))
    .map(integration => refreshAccessToken(integration.integration_id))

  const results = await Promise.allSettled(refreshPromises)

  const refreshed = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`🔄 Token refresh complete: ${refreshed} refreshed, ${failed} failed`)

  return { refreshed, failed }
}
