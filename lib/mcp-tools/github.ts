import { getValidAccessToken } from '@/lib/refresh-token'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  language: string | null
  forks_count: number
  open_issues_count: number
  default_branch: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  state: string
  created_at: string
  updated_at: string
  html_url: string
  user: {
    login: string
  }
  body: string | null
  labels: Array<{ name: string; color: string }>
}

/**
 * List all repositories for the authenticated user
 */
export async function githubListRepos(integrationId: string): Promise<GitHubRepo[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  return response.json()
}

/**
 * Search repositories for the authenticated user
 */
export async function githubSearchRepos(integrationId: string, query: string): Promise<GitHubRepo[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+user:@me&per_page=50`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Get repository details
 */
export async function githubGetRepo(integrationId: string, owner: string, repo: string): Promise<GitHubRepo> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  return response.json()
}

/**
 * List issues for a repository
 */
export async function githubListIssues(integrationId: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=50`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  return response.json()
}

/**
 * Create an issue in a repository
 */
export async function githubCreateIssue(
  integrationId: string,
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[]
): Promise<GitHubIssue> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body, labels })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  return response.json()
}

/**
 * Get authenticated user info
 */
export async function githubGetUser(integrationId: string) {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  return response.json()
}

/**
 * Search code across repositories
 */
export async function githubSearchCode(integrationId: string, query: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}+user:@me&per_page=30`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MetaWurks-Chat-App'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}
