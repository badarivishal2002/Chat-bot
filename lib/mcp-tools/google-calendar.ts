import { getValidAccessToken } from '@/lib/refresh-token'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    responseStatus: string
  }>
  htmlLink: string
  status: string
}

/**
 * List calendar events
 */
export async function calendarListEvents(integrationId: string, maxResults: number = 20): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const timeMin = new Date().toISOString()
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin
  })

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Create calendar event
 */
export async function calendarCreateEvent(
  integrationId: string,
  summary: string,
  start: string,
  end: string,
  description?: string,
  attendees?: string[]
): Promise<CalendarEvent> {
  const accessToken = await getValidAccessToken(integrationId)

  const event = {
    summary,
    description,
    start: {
      dateTime: start,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: end,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    attendees: attendees?.map(email => ({ email }))
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }

  return response.json()
}

/**
 * Update calendar event
 */
export async function calendarUpdateEvent(
  integrationId: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }

  return response.json()
}

/**
 * Delete calendar event
 */
export async function calendarDeleteEvent(integrationId: string, eventId: string): Promise<void> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }
}

/**
 * Search calendar events
 */
export async function calendarSearchEvents(integrationId: string, query: string): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    q: query,
    maxResults: '50',
    orderBy: 'startTime',
    singleEvents: 'true'
  })

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}

/**
 * List calendars
 */
export async function calendarListCalendars(integrationId: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Get today's events
 */
export async function calendarGetTodayEvents(integrationId: string): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const params = new URLSearchParams({
    timeMin: today.toISOString(),
    timeMax: tomorrow.toISOString(),
    orderBy: 'startTime',
    singleEvents: 'true'
  })

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}
