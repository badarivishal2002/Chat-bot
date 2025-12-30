import { getValidAccessToken } from '@/lib/refresh-token'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  size?: string
  createdTime: string
  modifiedTime: string
  owners?: Array<{ displayName: string; emailAddress: string }>
  shared: boolean
}

/**
 * List files from Google Drive
 */
export async function driveListFiles(integrationId: string, pageSize: number = 20): Promise<DriveFile[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields: 'files(id,name,mimeType,webViewLink,size,createdTime,modifiedTime,owners,shared)',
    orderBy: 'modifiedTime desc'
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Drive API error: ${error}`)
  }

  const data = await response.json()
  return data.files || []
}

/**
 * Search files in Google Drive
 */
export async function driveSearchFiles(integrationId: string, query: string): Promise<DriveFile[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    q: `name contains '${query}' or fullText contains '${query}'`,
    pageSize: '50',
    fields: 'files(id,name,mimeType,webViewLink,size,createdTime,modifiedTime,owners,shared)',
    orderBy: 'modifiedTime desc'
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Drive API error: ${error}`)
  }

  const data = await response.json()
  return data.files || []
}

/**
 * Get file metadata
 */
export async function driveGetFile(integrationId: string, fileId: string): Promise<DriveFile> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    fields: 'id,name,mimeType,webViewLink,size,createdTime,modifiedTime,owners,shared,description'
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Drive API error: ${error}`)
  }

  return response.json()
}

/**
 * Get file content (for text files)
 */
export async function driveGetFileContent(integrationId: string, fileId: string): Promise<string> {
  const accessToken = await getValidAccessToken(integrationId)

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Drive API error: ${error}`)
  }

  return response.text()
}

/**
 * List recent files
 */
export async function driveListRecentFiles(integrationId: string, limit: number = 10): Promise<DriveFile[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    pageSize: limit.toString(),
    fields: 'files(id,name,mimeType,webViewLink,modifiedTime,owners)',
    orderBy: 'viewedByMeTime desc',
    q: 'viewedByMeTime > "2020-01-01T00:00:00"'
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Drive API error: ${error}`)
  }

  const data = await response.json()
  return data.files || []
}

/**
 * Search files by type
 */
export async function driveSearchByType(integrationId: string, mimeType: string): Promise<DriveFile[]> {
  const accessToken = await getValidAccessToken(integrationId)

  const params = new URLSearchParams({
    q: `mimeType='${mimeType}'`,
    pageSize: '50',
    fields: 'files(id,name,mimeType,webViewLink,size,modifiedTime)',
    orderBy: 'modifiedTime desc'
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Drive API error: ${error}`)
  }

  const data = await response.json()
  return data.files || []
}
