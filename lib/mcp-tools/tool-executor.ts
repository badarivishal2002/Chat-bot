import * as github from './github'
import * as drive from './google-drive'
import * as gmail from './gmail'
import * as slack from './slack'
import * as calendar from './google-calendar'
import * as jira from './jira'
import * as notion from './notion'
import Integration from '@/models/Integration'
import dbConnect from '@/lib/db'

/**
 * Execute an MCP tool call
 */
export async function executeMCPTool(
  userId: string,
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  await dbConnect()

  // Determine integration type from tool name
  const integrationType = getIntegrationTypeFromTool(toolName)
  if (!integrationType) {
    throw new Error(`Unknown tool: ${toolName}`)
  }

  // Find user's integration of this type
  const integration = await Integration.findOne({
    user_id: userId,
    type: integrationType,
    enabled: true
  })

  if (!integration) {
    throw new Error(`${integrationType} integration not connected. Please connect it in Settings → Integrations.`)
  }

  const integrationId = integration.integration_id

  // Execute the tool
  try {
    console.log(`🔧 Executing MCP tool: ${toolName}`, args)

    const result = await routeToolCall(toolName, integrationId, args)

    console.log(`✅ Tool executed successfully: ${toolName}`)

    // Update last_used timestamp
    integration.last_used = new Date()
    await integration.save()

    return result
  } catch (error) {
    console.error(`❌ Tool execution failed: ${toolName}`, error)
    throw error
  }
}

/**
 * Route tool call to the appropriate function
 */
async function routeToolCall(
  toolName: string,
  integrationId: string,
  args: Record<string, any>
): Promise<any> {
  switch (toolName) {
    // ==================== GITHUB ====================
    case 'github_list_repos':
      return github.githubListRepos(integrationId)

    case 'github_search_repos':
      return github.githubSearchRepos(integrationId, args.query)

    case 'github_get_repo':
      return github.githubGetRepo(integrationId, args.owner, args.repo)

    case 'github_list_issues':
      return github.githubListIssues(integrationId, args.owner, args.repo, args.state)

    case 'github_create_issue':
      return github.githubCreateIssue(
        integrationId,
        args.owner,
        args.repo,
        args.title,
        args.body,
        args.labels
      )

    case 'github_get_user':
      return github.githubGetUser(integrationId)

    case 'github_search_code':
      return github.githubSearchCode(integrationId, args.query)

    // ==================== GOOGLE DRIVE ====================
    case 'drive_list_files':
      return drive.driveListFiles(integrationId, args.limit || 20)

    case 'drive_search_files':
      return drive.driveSearchFiles(integrationId, args.query)

    case 'drive_get_file':
      return drive.driveGetFile(integrationId, args.fileId)

    case 'drive_recent_files':
      return drive.driveListRecentFiles(integrationId, args.limit || 10)

    // ==================== GMAIL ====================
    case 'gmail_list_messages':
      return gmail.gmailListMessages(integrationId, args.limit || 20)

    case 'gmail_search_messages':
      return gmail.gmailSearchMessages(integrationId, args.query)

    case 'gmail_get_message':
      return gmail.gmailGetMessage(integrationId, args.messageId)

    case 'gmail_send_message':
      return gmail.gmailSendMessage(integrationId, args.to, args.subject, args.body)

    case 'gmail_unread_count':
      return gmail.gmailGetUnreadCount(integrationId)

    // ==================== SLACK ====================
    case 'slack_list_channels':
      return slack.slackListChannels(integrationId)

    case 'slack_send_message':
      return slack.slackSendMessage(integrationId, args.channel, args.text)

    case 'slack_get_channel_history':
      return slack.slackGetChannelHistory(integrationId, args.channel, args.limit)

    case 'slack_search_messages':
      return slack.slackSearchMessages(integrationId, args.query)

    case 'slack_list_users':
      return slack.slackListUsers(integrationId)

    // ==================== GOOGLE CALENDAR ====================
    case 'calendar_list_events':
      return calendar.calendarListEvents(integrationId, args.limit)

    case 'calendar_create_event':
      return calendar.calendarCreateEvent(
        integrationId,
        args.summary,
        args.start,
        args.end,
        args.description,
        args.attendees
      )

    case 'calendar_search_events':
      return calendar.calendarSearchEvents(integrationId, args.query)

    case 'calendar_today_events':
      return calendar.calendarGetTodayEvents(integrationId)

    // ==================== JIRA ====================
    case 'jira_list_projects':
      return jira.jiraListProjects(integrationId)

    case 'jira_list_issues':
      return jira.jiraListIssues(integrationId, args.projectKey, args.limit)

    case 'jira_create_issue':
      return jira.jiraCreateIssue(
        integrationId,
        args.projectKey,
        args.summary,
        args.description,
        args.issueType
      )

    case 'jira_search_issues':
      return jira.jiraSearchIssues(integrationId, args.jql, args.limit)

    case 'jira_get_issue':
      return jira.jiraGetIssue(integrationId, args.issueKey)

    // ==================== NOTION ====================
    case 'notion_search':
      return notion.notionSearch(integrationId, args.query)

    case 'notion_list_pages':
      return notion.notionListPages(integrationId)

    case 'notion_get_page':
      return notion.notionGetPage(integrationId, args.pageId)

    case 'notion_create_page':
      return notion.notionCreatePage(
        integrationId,
        args.parentId,
        args.title,
        args.content
      )

    case 'notion_list_databases':
      return notion.notionListDatabases(integrationId)

    case 'notion_query_database':
      return notion.notionQueryDatabase(integrationId, args.databaseId)

    default:
      throw new Error(`Tool not implemented: ${toolName}`)
  }
}

/**
 * Get integration type from tool name
 */
function getIntegrationTypeFromTool(toolName: string): string | null {
  if (toolName.startsWith('github_')) return 'github'
  if (toolName.startsWith('drive_')) return 'google-drive'
  if (toolName.startsWith('gmail_')) return 'email'
  if (toolName.startsWith('slack_')) return 'slack'
  if (toolName.startsWith('calendar_')) return 'calendar'
  if (toolName.startsWith('jira_')) return 'jira'
  if (toolName.startsWith('notion_')) return 'notion'
  return null
}

/**
 * Get all available MCP tools for a user based on their connected integrations
 */
export async function getUserMCPTools(userId: string) {
  await dbConnect()

  const integrations = await Integration.find({
    user_id: userId,
    enabled: true
  })

  const { mcpToolDefinitions, getToolsForIntegrationType } = await import('./tool-definitions')

  const availableTools: any[] = []
  const integrationMap: Record<string, string> = {}

  for (const integration of integrations) {
    const toolNames = getToolsForIntegrationType(integration.type)

    for (const toolName of toolNames) {
      const toolDef = mcpToolDefinitions[toolName as keyof typeof mcpToolDefinitions]
      if (toolDef) {
        availableTools.push(toolDef)
        integrationMap[toolName] = integration.integration_id
      }
    }
  }

  return {
    tools: availableTools,
    integrationMap
  }
}
