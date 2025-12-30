import { getValidAccessToken } from '@/lib/refresh-token'

export interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  is_private: boolean
  is_archived: boolean
  num_members?: number
}

export interface SlackMessage {
  type: string
  user: string
  text: string
  ts: string
}

/**
 * List Slack channels
 */
export async function slackListChannels(integrationId: string): Promise<SlackChannel[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Slack API error: ${error}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.channels || []
}

/**
 * Send message to Slack channel
 */
export async function slackSendMessage(integrationId: string, channel: string, text: string): Promise<any> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channel, text })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Slack API error: ${error}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data
}

/**
 * Get channel history
 */
export async function slackGetChannelHistory(integrationId: string, channel: string, limit: number = 10): Promise<SlackMessage[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Slack API error: ${error}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.messages || []
}

/**
 * Search messages
 */
export async function slackSearchMessages(integrationId: string, query: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://slack.com/api/search.messages?query=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Slack API error: ${error}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.messages?.matches || []
}

/**
 * List team members
 */
export async function slackListUsers(integrationId: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://slack.com/api/users.list', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Slack API error: ${error}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.members || []
}

/**
 * Get user info
 */
export async function slackGetUser(integrationId: string, userId: string): Promise<any> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Slack API error: ${error}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.user
}
