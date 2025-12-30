import { getValidAccessToken } from '@/lib/refresh-token'

const NOTION_API_VERSION = '2022-06-28'

export interface NotionPage {
  id: string
  created_time: string
  last_edited_time: string
  url: string
  properties: any
  parent: any
}

export interface NotionDatabase {
  id: string
  title: Array<{ plain_text: string }>
  description: Array<{ plain_text: string }>
  created_time: string
  last_edited_time: string
  url: string
}

/**
 * Search Notion pages and databases
 */
export async function notionSearch(integrationId: string, query: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * List all pages
 */
export async function notionListPages(integrationId: string): Promise<NotionPage[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: {
        property: 'object',
        value: 'page'
      },
      page_size: 100
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * Get page content
 */
export async function notionGetPage(integrationId: string, pageId: string): Promise<NotionPage> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  return response.json()
}

/**
 * Get page blocks (content)
 */
export async function notionGetPageBlocks(integrationId: string, pageId: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * Create page
 */
export async function notionCreatePage(
  integrationId: string,
  parentId: string,
  title: string,
  content?: string
): Promise<NotionPage> {
  const accessToken = await getValidAccessToken(integrationId)

  const page = {
    parent: { page_id: parentId },
    properties: {
      title: {
        title: [
          {
            text: {
              content: title
            }
          }
        ]
      }
    },
    children: content ? [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content
              }
            }
          ]
        }
      }
    ] : []
  }

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(page)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  return response.json()
}

/**
 * Update page
 */
export async function notionUpdatePage(
  integrationId: string,
  pageId: string,
  updates: { title?: string }
): Promise<NotionPage> {
  const accessToken = await getValidAccessToken(integrationId)

  const properties: any = {}

  if (updates.title) {
    properties.title = {
      title: [
        {
          text: {
            content: updates.title
          }
        }
      ]
    }
  }

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  return response.json()
}

/**
 * List databases
 */
export async function notionListDatabases(integrationId: string): Promise<NotionDatabase[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: {
        property: 'object',
        value: 'database'
      },
      page_size: 100
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * Query database
 */
export async function notionQueryDatabase(integrationId: string, databaseId: string, filter?: any): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filter, page_size: 100 })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * Create database entry (page in database)
 */
export async function notionCreateDatabaseEntry(
  integrationId: string,
  databaseId: string,
  properties: any
): Promise<NotionPage> {
  const accessToken = await getValidAccessToken(integrationId)

  const page = {
    parent: { database_id: databaseId },
    properties
  }

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(page)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  return response.json()
}
