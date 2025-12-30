import { getValidAccessToken } from '@/lib/refresh-token'

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: any
    status: {
      name: string
    }
    priority?: {
      name: string
    }
    assignee?: {
      displayName: string
      emailAddress: string
    }
    reporter?: {
      displayName: string
    }
    created: string
    updated: string
    issuetype: {
      name: string
    }
  }
}

export interface JiraProject {
  id: string
  key: string
  name: string
  description?: string
  lead: {
    displayName: string
  }
}

/**
 * Get Jira cloud ID (required for API calls)
 */
async function getCloudId(accessToken: string): Promise<string> {
  const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get Jira cloud ID')
  }

  const resources = await response.json()
  if (!resources || resources.length === 0) {
    throw new Error('No Jira sites found')
  }

  return resources[0].id
}

/**
 * List Jira projects
 */
export async function jiraListProjects(integrationId: string): Promise<JiraProject[]> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }

  return response.json()
}

/**
 * List issues from project
 */
export async function jiraListIssues(integrationId: string, projectKey: string, maxResults: number = 50): Promise<JiraIssue[]> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const jql = `project = ${projectKey} ORDER BY updated DESC`

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }

  const data = await response.json()
  return data.issues || []
}

/**
 * Create Jira issue
 */
export async function jiraCreateIssue(
  integrationId: string,
  projectKey: string,
  summary: string,
  description?: string,
  issueType: string = 'Task'
): Promise<JiraIssue> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const issue = {
    fields: {
      project: {
        key: projectKey
      },
      summary,
      description: description ? {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: description
              }
            ]
          }
        ]
      } : undefined,
      issuetype: {
        name: issueType
      }
    }
  }

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(issue)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }

  return response.json()
}

/**
 * Update Jira issue
 */
export async function jiraUpdateIssue(
  integrationId: string,
  issueKey: string,
  updates: { summary?: string; description?: string }
): Promise<void> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const fields: any = {}

  if (updates.summary) {
    fields.summary = updates.summary
  }

  if (updates.description) {
    fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: updates.description
            }
          ]
        }
      ]
    }
  }

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }
}

/**
 * Search Jira issues using JQL
 */
export async function jiraSearchIssues(integrationId: string, jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }

  const data = await response.json()
  return data.issues || []
}

/**
 * Get issue details
 */
export async function jiraGetIssue(integrationId: string, issueKey: string): Promise<JiraIssue> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }

  return response.json()
}

/**
 * Add comment to issue
 */
export async function jiraAddComment(integrationId: string, issueKey: string, comment: string): Promise<any> {
  const accessToken = await getValidAccessToken(integrationId)
  const cloudId = await getCloudId(accessToken)

  const body = {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: comment
            }
          ]
        }
      ]
    }
  }

  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jira API error: ${error}`)
  }

  return response.json()
}
