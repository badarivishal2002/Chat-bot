import { getValidAccessToken } from '@/lib/refresh-token'

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  subject?: string
  from?: string
  to?: string
  date?: string
  body?: string
}

/**
 * List Gmail messages
 */
export async function gmailListMessages(integrationId: string, maxResults: number = 20): Promise<GmailMessage[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    maxResults: maxResults.toString()
  })

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gmail API error: ${error}`)
  }

  const data = await response.json()
  const messages = data.messages || []

  // Fetch full details for each message
  const fullMessages = await Promise.all(
    messages.slice(0, 10).map((msg: { id: string }) => gmailGetMessage(integrationId, msg.id))
  )

  return fullMessages
}

/**
 * Get a specific Gmail message
 */
export async function gmailGetMessage(integrationId: string, messageId: string): Promise<GmailMessage> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gmail API error: ${error}`)
  }

  const message = await response.json()

  // Extract headers
  const headers = message.payload?.headers || []
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject'
  const from = headers.find((h: any) => h.name === 'From')?.value || ''
  const to = headers.find((h: any) => h.name === 'To')?.value || ''
  const date = headers.find((h: any) => h.name === 'Date')?.value || ''

  // Extract body
  let body = ''
  if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
  } else if (message.payload?.parts) {
    const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain')
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    snippet: message.snippet || '',
    subject,
    from,
    to,
    date,
    body: body.substring(0, 1000) // Limit to 1000 chars
  }
}

/**
 * Search Gmail messages
 */
export async function gmailSearchMessages(integrationId: string, query: string): Promise<GmailMessage[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    q: query,
    maxResults: '20'
  })

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gmail API error: ${error}`)
  }

  const data = await response.json()
  const messages = data.messages || []

  // Fetch full details for first 10 messages
  const fullMessages = await Promise.all(
    messages.slice(0, 10).map((msg: { id: string }) => gmailGetMessage(integrationId, msg.id))
  )

  return fullMessages
}

/**
 * Send an email via Gmail
 */
export async function gmailSendMessage(
  integrationId: string,
  to: string,
  subject: string,
  body: string
): Promise<GmailMessage> {
  const accessToken = await getValidAccessToken(integrationId)

  // Create RFC 2822 formatted message
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ].join('\n')

  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gmail API error: ${error}`)
  }

  return response.json()
}

/**
 * Get unread message count
 */
export async function gmailGetUnreadCount(integrationId: string): Promise<number> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    q: 'is:unread',
    maxResults: '1'
  })

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gmail API error: ${error}`)
  }

  const data = await response.json()
  return data.resultSizeEstimate || 0
}

/**
 * List labels
 */
export async function gmailListLabels(integrationId: string) {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gmail API error: ${error}`)
  }

  const data = await response.json()
  return data.labels || []
}
