import { getValidAccessToken, needsTokenRefresh } from '@/lib/refresh-token'
import Integration from '@/models/Integration'
import dbConnect from '@/lib/db'

/**
 * Get integration data with automatic token refresh
 * This middleware automatically refreshes tokens if they're about to expire
 */
export async function getIntegrationWithValidToken(integrationId: string) {
  await dbConnect()

  const integration = await Integration.findOne({ integration_id: integrationId })
  if (!integration) {
    throw new Error('Integration not found')
  }

  // Auto-refresh if needed
  if (needsTokenRefresh(integration)) {
    console.log(`🔄 Auto-refreshing token for ${integration.type}`)
    const accessToken = await getValidAccessToken(integrationId)

    // Refresh the integration data
    const updatedIntegration = await Integration.findOne({ integration_id: integrationId })
    return {
      integration: updatedIntegration,
      accessToken
    }
  }

  const accessToken = integration.credentials.get('access_token')
  return {
    integration,
    accessToken
  }
}

/**
 * Get all user integrations with automatic token refresh
 */
export async function getUserIntegrationsWithValidTokens(userId: string) {
  await dbConnect()

  const integrations = await Integration.find({
    user_id: userId,
    enabled: true
  })

  // Auto-refresh tokens that are expiring
  const refreshPromises = integrations
    .filter(integration => needsTokenRefresh(integration))
    .map(async (integration) => {
      try {
        console.log(`🔄 Auto-refreshing token for ${integration.type}`)
        await getValidAccessToken(integration.integration_id)
      } catch (error) {
        console.error(`Failed to refresh token for ${integration.type}:`, error)
      }
    })

  await Promise.allSettled(refreshPromises)

  // Fetch fresh data
  const freshIntegrations = await Integration.find({
    user_id: userId,
    enabled: true
  })

  return freshIntegrations.map(integration => ({
    integration_id: integration.integration_id,
    type: integration.type,
    name: integration.name,
    enabled: integration.enabled,
    accessToken: integration.credentials.get('access_token'),
    config: integration.config
  }))
}

/**
 * Scheduled job to refresh all expiring tokens
 * Call this periodically (e.g., every 30 minutes)
 */
export async function refreshExpiringTokensJob() {
  await dbConnect()

  console.log('🔄 [Cron] Starting token refresh job...')

  // Find all integrations with tokens expiring in the next hour
  const oneHourFromNow = Date.now() + 60 * 60 * 1000

  const integrations = await Integration.find({ enabled: true })

  const expiringIntegrations = integrations.filter(integration => {
    const expiresAt = integration.credentials.get('expires_at')
    if (!expiresAt) return false

    const expiryTime = parseInt(expiresAt)
    return expiryTime < oneHourFromNow
  })

  console.log(`🔄 [Cron] Found ${expiringIntegrations.length} tokens to refresh`)

  const refreshPromises = expiringIntegrations.map(async (integration) => {
    try {
      await getValidAccessToken(integration.integration_id)
      return { success: true, type: integration.type }
    } catch (error) {
      console.error(`Failed to refresh ${integration.type}:`, error)
      return { success: false, type: integration.type }
    }
  })

  const results = await Promise.allSettled(refreshPromises)
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`✅ [Cron] Token refresh complete: ${successful} successful, ${failed} failed`)

  return { successful, failed }
}
