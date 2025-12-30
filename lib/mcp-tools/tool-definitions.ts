/**
 * MCP Tool Definitions for AI
 * These tools are dynamically added based on user's connected integrations
 */

export const mcpToolDefinitions = {
  // ==================== GITHUB TOOLS ====================
  github_list_repos: {
    type: 'function' as const,
    function: {
      name: 'github_list_repos',
      description: 'List all GitHub repositories for the authenticated user. Returns repository name, description, URL, stars, and more.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  github_search_repos: {
    type: 'function' as const,
    function: {
      name: 'github_search_repos',
      description: 'Search GitHub repositories by query (name, description, or README content).',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for repositories (e.g., "react", "nextjs app", "typescript")'
          }
        },
        required: ['query']
      }
    }
  },

  github_get_repo: {
    type: 'function' as const,
    function: {
      name: 'github_get_repo',
      description: 'Get detailed information about a specific GitHub repository.',
      parameters: {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner username or organization name'
          },
          repo: {
            type: 'string',
            description: 'Repository name'
          }
        },
        required: ['owner', 'repo']
      }
    }
  },

  github_list_issues: {
    type: 'function' as const,
    function: {
      name: 'github_list_issues',
      description: 'List issues for a GitHub repository. Can filter by open, closed, or all issues.',
      parameters: {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner username'
          },
          repo: {
            type: 'string',
            description: 'Repository name'
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'Issue state filter (default: open)'
          }
        },
        required: ['owner', 'repo']
      }
    }
  },

  github_create_issue: {
    type: 'function' as const,
    function: {
      name: 'github_create_issue',
      description: 'Create a new issue in a GitHub repository.',
      parameters: {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner username'
          },
          repo: {
            type: 'string',
            description: 'Repository name'
          },
          title: {
            type: 'string',
            description: 'Issue title'
          },
          body: {
            type: 'string',
            description: 'Issue description/body (optional)'
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Labels to add to the issue (optional)'
          }
        },
        required: ['owner', 'repo', 'title']
      }
    }
  },

  github_get_user: {
    type: 'function' as const,
    function: {
      name: 'github_get_user',
      description: 'Get information about the authenticated GitHub user (username, bio, repos count, etc).',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  github_search_code: {
    type: 'function' as const,
    function: {
      name: 'github_search_code',
      description: 'Search code across all user repositories by keyword or pattern.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Code search query (e.g., "useState", "export function", "class Component")'
          }
        },
        required: ['query']
      }
    }
  },

  // ==================== GOOGLE DRIVE TOOLS ====================
  drive_list_files: {
    type: 'function' as const,
    function: {
      name: 'drive_list_files',
      description: 'List recent files from Google Drive (documents, spreadsheets, presentations, etc).',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of files to return (default: 20, max: 100)'
          }
        },
        required: []
      }
    }
  },

  drive_search_files: {
    type: 'function' as const,
    function: {
      name: 'drive_search_files',
      description: 'Search Google Drive files by name or content.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (file name or content keywords)'
          }
        },
        required: ['query']
      }
    }
  },

  drive_get_file: {
    type: 'function' as const,
    function: {
      name: 'drive_get_file',
      description: 'Get metadata for a specific Google Drive file.',
      parameters: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'Google Drive file ID'
          }
        },
        required: ['fileId']
      }
    }
  },

  drive_recent_files: {
    type: 'function' as const,
    function: {
      name: 'drive_recent_files',
      description: 'Get recently accessed files from Google Drive.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent files to return (default: 10)'
          }
        },
        required: []
      }
    }
  },

  // ==================== GMAIL TOOLS ====================
  gmail_list_messages: {
    type: 'function' as const,
    function: {
      name: 'gmail_list_messages',
      description: 'List recent Gmail messages (subject, sender, snippet, date).',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of messages to return (default: 20, max: 50)'
          }
        },
        required: []
      }
    }
  },

  gmail_search_messages: {
    type: 'function' as const,
    function: {
      name: 'gmail_search_messages',
      description: 'Search Gmail messages using Gmail search syntax (e.g., "from:john@example.com", "subject:invoice", "is:unread").',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Gmail search query (supports Gmail search operators)'
          }
        },
        required: ['query']
      }
    }
  },

  gmail_get_message: {
    type: 'function' as const,
    function: {
      name: 'gmail_get_message',
      description: 'Get full details of a specific Gmail message including body content.',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'Gmail message ID'
          }
        },
        required: ['messageId']
      }
    }
  },

  gmail_send_message: {
    type: 'function' as const,
    function: {
      name: 'gmail_send_message',
      description: 'Send an email via Gmail.',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address'
          },
          subject: {
            type: 'string',
            description: 'Email subject'
          },
          body: {
            type: 'string',
            description: 'Email body content (plain text)'
          }
        },
        required: ['to', 'subject', 'body']
      }
    }
  },

  gmail_unread_count: {
    type: 'function' as const,
    function: {
      name: 'gmail_unread_count',
      description: 'Get the number of unread messages in Gmail inbox.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  // ==================== SLACK TOOLS ====================
  slack_list_channels: {
    type: 'function' as const,
    function: {
      name: 'slack_list_channels',
      description: 'List all Slack channels in the workspace (public and private channels user has access to).',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  slack_send_message: {
    type: 'function' as const,
    function: {
      name: 'slack_send_message',
      description: 'Send a message to a Slack channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID or name (e.g., "general", "#random", or channel ID)'
          },
          text: {
            type: 'string',
            description: 'Message text to send'
          }
        },
        required: ['channel', 'text']
      }
    }
  },

  slack_get_channel_history: {
    type: 'function' as const,
    function: {
      name: 'slack_get_channel_history',
      description: 'Get recent messages from a Slack channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID'
          },
          limit: {
            type: 'number',
            description: 'Number of messages to retrieve (default: 10, max: 100)'
          }
        },
        required: ['channel']
      }
    }
  },

  slack_search_messages: {
    type: 'function' as const,
    function: {
      name: 'slack_search_messages',
      description: 'Search messages across all Slack channels.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query text'
          }
        },
        required: ['query']
      }
    }
  },

  slack_list_users: {
    type: 'function' as const,
    function: {
      name: 'slack_list_users',
      description: 'List all team members in the Slack workspace.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  // ==================== GOOGLE CALENDAR TOOLS ====================
  calendar_list_events: {
    type: 'function' as const,
    function: {
      name: 'calendar_list_events',
      description: 'List upcoming calendar events from Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of events to return (default: 20)'
          }
        },
        required: []
      }
    }
  },

  calendar_create_event: {
    type: 'function' as const,
    function: {
      name: 'calendar_create_event',
      description: 'Create a new calendar event in Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Event title/summary'
          },
          start: {
            type: 'string',
            description: 'Start date/time in ISO 8601 format (e.g., "2024-12-31T14:00:00")'
          },
          end: {
            type: 'string',
            description: 'End date/time in ISO 8601 format'
          },
          description: {
            type: 'string',
            description: 'Event description (optional)'
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of attendee email addresses (optional)'
          }
        },
        required: ['summary', 'start', 'end']
      }
    }
  },

  calendar_search_events: {
    type: 'function' as const,
    function: {
      name: 'calendar_search_events',
      description: 'Search calendar events by keyword.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (event title or description)'
          }
        },
        required: ['query']
      }
    }
  },

  calendar_today_events: {
    type: 'function' as const,
    function: {
      name: 'calendar_today_events',
      description: "Get today's calendar events.",
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  // ==================== JIRA TOOLS ====================
  jira_list_projects: {
    type: 'function' as const,
    function: {
      name: 'jira_list_projects',
      description: 'List all Jira projects user has access to.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  jira_list_issues: {
    type: 'function' as const,
    function: {
      name: 'jira_list_issues',
      description: 'List issues from a Jira project.',
      parameters: {
        type: 'object',
        properties: {
          projectKey: {
            type: 'string',
            description: 'Project key (e.g., "PROJ", "DEV")'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of issues to return (default: 50)'
          }
        },
        required: ['projectKey']
      }
    }
  },

  jira_create_issue: {
    type: 'function' as const,
    function: {
      name: 'jira_create_issue',
      description: 'Create a new issue in Jira project.',
      parameters: {
        type: 'object',
        properties: {
          projectKey: {
            type: 'string',
            description: 'Project key where issue will be created'
          },
          summary: {
            type: 'string',
            description: 'Issue title/summary'
          },
          description: {
            type: 'string',
            description: 'Issue description (optional)'
          },
          issueType: {
            type: 'string',
            description: 'Issue type (e.g., "Task", "Bug", "Story") - default: "Task"'
          }
        },
        required: ['projectKey', 'summary']
      }
    }
  },

  jira_search_issues: {
    type: 'function' as const,
    function: {
      name: 'jira_search_issues',
      description: 'Search Jira issues using JQL (Jira Query Language).',
      parameters: {
        type: 'object',
        properties: {
          jql: {
            type: 'string',
            description: 'JQL query (e.g., "project = DEV AND status = Open", "assignee = currentUser()")'
          },
          limit: {
            type: 'number',
            description: 'Maximum results (default: 50)'
          }
        },
        required: ['jql']
      }
    }
  },

  jira_get_issue: {
    type: 'function' as const,
    function: {
      name: 'jira_get_issue',
      description: 'Get detailed information about a specific Jira issue.',
      parameters: {
        type: 'object',
        properties: {
          issueKey: {
            type: 'string',
            description: 'Issue key (e.g., "PROJ-123")'
          }
        },
        required: ['issueKey']
      }
    }
  },

  // ==================== NOTION TOOLS ====================
  notion_search: {
    type: 'function' as const,
    function: {
      name: 'notion_search',
      description: 'Search Notion pages and databases by keyword.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query text'
          }
        },
        required: ['query']
      }
    }
  },

  notion_list_pages: {
    type: 'function' as const,
    function: {
      name: 'notion_list_pages',
      description: 'List all Notion pages user has access to.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  notion_get_page: {
    type: 'function' as const,
    function: {
      name: 'notion_get_page',
      description: 'Get content and metadata of a specific Notion page.',
      parameters: {
        type: 'object',
        properties: {
          pageId: {
            type: 'string',
            description: 'Notion page ID'
          }
        },
        required: ['pageId']
      }
    }
  },

  notion_create_page: {
    type: 'function' as const,
    function: {
      name: 'notion_create_page',
      description: 'Create a new page in Notion.',
      parameters: {
        type: 'object',
        properties: {
          parentId: {
            type: 'string',
            description: 'Parent page ID where new page will be created'
          },
          title: {
            type: 'string',
            description: 'Page title'
          },
          content: {
            type: 'string',
            description: 'Page content (optional)'
          }
        },
        required: ['parentId', 'title']
      }
    }
  },

  notion_list_databases: {
    type: 'function' as const,
    function: {
      name: 'notion_list_databases',
      description: 'List all Notion databases user has access to.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  notion_query_database: {
    type: 'function' as const,
    function: {
      name: 'notion_query_database',
      description: 'Query a Notion database to retrieve entries.',
      parameters: {
        type: 'object',
        properties: {
          databaseId: {
            type: 'string',
            description: 'Notion database ID'
          }
        },
        required: ['databaseId']
      }
    }
  }
}

/**
 * Get MCP tools for a specific integration type
 */
export function getToolsForIntegrationType(integrationType: string) {
  const toolMap: Record<string, string[]> = {
    github: [
      'github_list_repos',
      'github_search_repos',
      'github_get_repo',
      'github_list_issues',
      'github_create_issue',
      'github_get_user',
      'github_search_code'
    ],
    'google-drive': [
      'drive_list_files',
      'drive_search_files',
      'drive_get_file',
      'drive_recent_files'
    ],
    email: [
      'gmail_list_messages',
      'gmail_search_messages',
      'gmail_get_message',
      'gmail_send_message',
      'gmail_unread_count'
    ],
    slack: [
      'slack_list_channels',
      'slack_send_message',
      'slack_get_channel_history',
      'slack_search_messages',
      'slack_list_users'
    ],
    calendar: [
      'calendar_list_events',
      'calendar_create_event',
      'calendar_search_events',
      'calendar_today_events'
    ],
    jira: [
      'jira_list_projects',
      'jira_list_issues',
      'jira_create_issue',
      'jira_search_issues',
      'jira_get_issue'
    ],
    notion: [
      'notion_search',
      'notion_list_pages',
      'notion_get_page',
      'notion_create_page',
      'notion_list_databases',
      'notion_query_database'
    ]
  }

  return toolMap[integrationType] || []
}
