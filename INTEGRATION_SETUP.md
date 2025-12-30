# MCP Integration Setup Guide

This guide will help you set up OAuth credentials for all supported integrations in your chat application.

## Overview

Your app supports these OAuth-based integrations:
- ✅ **GitHub** - Access repositories, issues, PRs, code search
- ✅ **Google Drive** - Read and search files
- ✅ **Gmail** - Read and send emails
- ✅ **Google Calendar** - Access and create calendar events
- ✅ **Slack** - Send messages, read channels, search
- ✅ **Jira** - Manage projects, issues, comments
- ✅ **Notion** - Read and create pages, search workspaces

---

## 1. GitHub Integration

### Create OAuth App
1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `Your App Name`
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorization callback URL**: `http://localhost:3000/api/integrations/auth/callback/github`
4. Click **"Register application"**
5. Copy **Client ID** and generate **Client Secret**

### Add to .env
```bash
GITHUB_OAUTH_CLIENT_ID=your_client_id_here
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret_here
```

### Permissions Granted
- Read repository content
- Read user profile
- Read organization info

---

## 2. Google Services (Drive, Gmail, Calendar)

**Setup Google OAuth:**
```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

> **Note:** Replace with your actual Google OAuth credentials from Google Cloud Console.

### Update Authorized Redirect URIs
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add these redirect URIs:
   - `http://localhost:3000/api/integrations/auth/callback/google-drive`
   - `http://localhost:3000/api/integrations/auth/callback/email`
   - `http://localhost:3000/api/integrations/auth/callback/calendar`

### Enable Required APIs
1. Go to https://console.cloud.google.com/apis/library
2. Enable these APIs:
   - **Google Drive API**
   - **Gmail API**
   - **Google Calendar API**

## 3. Slack Integration

### Create Slack App
1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Enter app name and select workspace
4. Go to **"OAuth & Permissions"**
5. Add **Redirect URL**:
   - `http://localhost:3000/api/integrations/auth/callback/slack`
6. Under **"Scopes"** → **"User Token Scopes"**, add:
   - `channels:read`
   - `chat:write`
   - `files:read`
   - `users:read`
7. Go to **"Basic Information"**
8. Copy **Client ID** and **Client Secret**

### Add to .env
```bash
SLACK_OAUTH_CLIENT_ID=your_slack_client_id
SLACK_OAUTH_CLIENT_SECRET=your_slack_client_secret
```

---

## 4. Jira Integration (Atlassian)

### Create Atlassian OAuth App
1. Go to https://developer.atlassian.com/console/myapps/
2. Click **"Create"** → **"OAuth 2.0 integration"**
3. Enter app name
4. Under **"Authorization"**, add callback URL:
   - `http://localhost:3000/api/integrations/auth/callback/jira` (or `https://localhost:3000/api/integrations/auth/callback/jira` if using HTTPS)
5. Under **"Permissions"** → **"Jira API"**, add these **Classic scopes**:
   - `read:jira-work` (read issues, projects, boards)
   - `read:jira-user` (read user information)
   - `write:jira-work` (create and update issues, add comments)
   - `manage:jira-project` (manage projects - optional, for advanced features)
6. **Important**: If you see "Add granular scopes", you can also add granular scopes for better security:
   - `read:issue-details:jira`
   - `read:project:jira`
   - `write:issue:jira`
   - `read:user:jira`
   - `write:comment:jira`
7. Click **"Settings"** to get credentials
8. Copy **Client ID** and **Secret**

### Add to .env
```bash
JIRA_OAUTH_CLIENT_ID=your_jira_client_id
JIRA_OAUTH_CLIENT_SECRET=your_jira_client_secret
```

---

## 5. Notion Integration

### Create Notion Integration
1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Fill in:
   - **Name**: Your app name
   - **Associated workspace**: Select workspace
   - **Type**: Public
4. Under **"Distribution"**, click **"Manage distribution"**
5. Add **Redirect URI**:
   - `http://localhost:3000/api/integrations/auth/callback/notion`
6. Copy **OAuth client ID** and **OAuth client secret**

### Add to .env
```bash
NOTION_OAUTH_CLIENT_ID=your_notion_client_id
NOTION_OAUTH_CLIENT_SECRET=your_notion_client_secret
```

---

## Testing Your Integrations

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Settings
- Click your profile → **Settings**
- Go to **Integrations** tab

### 3. Add Integration
- Click **"Add Integration"**
- Click on any integration icon
- Authorize in the popup window
- Integration will appear in your list

### 4. Verify Integration
- You should see the integration with a green "Enabled" badge
- Check the console for any errors

---

## Troubleshooting

### "Failed to initiate authentication"
- Check that OAuth credentials are correctly set in `.env`
- Ensure callback URLs match exactly (including http/https)
- Restart your dev server after adding env variables

### OAuth popup closes immediately
- Check browser console for errors
- Verify redirect URI is added to OAuth app settings
- Check that the provider's API is enabled

### "Invalid client" error
- Double-check Client ID and Client Secret
- Ensure no extra spaces in `.env` file
- Verify you're using the correct OAuth credentials

### Integration not appearing in list
- Check MongoDB connection
- Look at server logs for database errors
- Verify Integration model is properly imported

---

## Production Deployment

When deploying to production:

1. **Update callback URLs** in all OAuth apps:
   - Replace `http://localhost:3000` with your production domain
   - Example: `https://yourdomain.com/api/integrations/auth/callback/github`

2. **Update .env variables**:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Secure credentials**:
   - Never commit `.env` file to Git
   - Use environment variables in hosting platform (Vercel, Netlify, etc.)
   - Rotate secrets regularly

4. **Test each integration** in production environment

---

## How Integrations Work in Your App

### 1. User Flow
```
User clicks integration → OAuth popup opens → User authorizes →
Token stored in DB → Integration appears in list → Tools available in chat
```

### 2. Data Storage
All integration credentials are stored in MongoDB:
- Collection: `integrations`
- User-specific (linked by `user_id`)
- Credentials encrypted (access tokens, refresh tokens)
- Automatic token refresh (5 minutes before expiry)

### 3. MCP Tool Calling
When user sends a message, the AI can:
1. Call integration tools directly (e.g., "list my GitHub repos")
2. Execute actions (e.g., "create a Jira ticket")
3. Search and retrieve data (e.g., "find emails from last week")
4. All tools are dynamically loaded based on connected integrations

**Total Tools Available**: 36 tools across 7 integrations
- GitHub: 7 tools (repos, issues, PRs, code search)
- Google Drive: 4 tools (list, search, file details)
- Gmail: 5 tools (list, search, send, read, unread count)
- Slack: 5 tools (channels, messages, send, search)
- Google Calendar: 4 tools (list, create, search events)
- Jira: 5 tools (projects, issues, create, update, search)
- Notion: 6 tools (pages, databases, search, create)

### 4. Security
- OAuth 2.0 with PKCE (state tokens)
- Tokens never exposed to frontend
- Automatic refresh tokens for long-term access
- User can disable/delete integrations anytime
- All API calls use server-side credentials only

---

## Next Steps

1. ✅ Set up OAuth credentials (follow sections 1-5 above)
2. ✅ MCP tool calling implemented (36 tools ready!)
3. 🔄 Test integrations in development
4. 🔄 Connect your integrations via Settings → Integrations
5. 🔄 Try tool calls in chat (e.g., "list my GitHub repos", "create a Jira issue")
6. 🔄 Deploy to production with updated callback URLs

---

## Need Help?

- Check server logs: `npm run dev` console output
- Check browser console: F12 → Console tab
- MongoDB logs: Check your MongoDB Atlas dashboard
- OAuth provider docs: Each provider has detailed OAuth documentation

---

**Happy integrating! 🚀**
