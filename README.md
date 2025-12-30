# AI Chat Application

A modern AI agent application built with Next.js and the Vercel AI SDK, featuring multi-model LLM support, conversation memory, and extensive tool integrations.

## Features

### AI Agent Capabilities
- **Multi-Model LLM Support**: OpenAI (GPT-4.1, GPT-5, GPT-5.2), Claude 4.5 Sonnet, Gemini 2.5 Flash, DeepSeek, Grok 4.1
- **Intelligent Tool System**: Automatic tool selection and multi-step reasoning (up to 15 steps)
- **Conversation Memory**: Semantic search across chat history with Mem0 AI
- **Web Research**: SERP API integration for web search and Cheerio-based scraping
- **OAuth Integrations**: GitHub, Google Drive, Gmail, Slack, Jira, Notion, Calendar (via MCP)
- **Real-time Streaming**: Streaming responses with source attribution and citations
- **Prompt Caching**: Cost optimization with provider-specific caching strategies

### Chat Features
- **Interactive Chat Interface**: Modern UI with streaming responses and typing indicators
- **Message Management**: Edit messages, regenerate responses, rollback conversations
- **Chat Organization**: Projects, folders, search, and filtering
- **Artifact Detection**: Automatic detection and rendering of code, HTML, React, SVG, diagrams
- **File Attachments**: Upload and send images, PDFs, documents in chat
- **Chat Sharing**: Secure sharing with public read-only links

### Authentication & User Management
- **NextAuth Integration**: Secure authentication with JWT sessions
- **User Accounts**: Registration, login, password reset, trial management
- **Early Access System**: Controlled onboarding with approval workflow
- **Session Management**: Persistent sessions with secure token handling

### Project Management
- **Project Creation**: Organize chats into projects with categories
- **Categories**: Investing, homework, writing, health, travel, creative, work, analytics, custom
- **Chat Assignment**: Add/remove chats from projects
- **Project Dashboard**: View all chats within a project

## Tech Stack

- **Framework**: Next.js 16.1 (App Router) with TypeScript 5.9
- **Frontend**: React 19.2, Tailwind CSS, shadcn/ui components
- **AI/LLM**:
  - Vercel AI SDK (@ai-sdk/*)
  - OpenAI, Anthropic Claude, Google Gemini, DeepSeek, xAI Grok
  - Mem0 AI for conversation memory
  - Langfuse for LLM monitoring
- **Backend**: Node.js with Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth 4.24 with JWT strategy
- **Integrations**:
  - SERP API (web search)
  - Cheerio (web scraping)
  - MCP tools (OAuth integrations)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS, CSS variables for theming

## Project Structure

```
metawurks-main-app/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── [...nextauth]/  # NextAuth handler
│   │   │   ├── forgot-password/ # Password reset request
│   │   │   └── reset-password/ # Password reset confirmation
│   │   ├── chat/               # Chat endpoints
│   │   │   ├── [chatId]/       # Chat-specific operations
│   │   │   ├── history/        # Chat history
│   │   │   ├── route.ts        # Main chat streaming endpoint
│   │   │   └── shared/         # Shared chat access
│   │   ├── integrations/       # OAuth integrations
│   │   │   ├── auth/           # OAuth flow (initiate, callback)
│   │   │   ├── [integrationId]/ # Integration management
│   │   │   ├── refresh-all/    # Token refresh
│   │   │   └── route.ts        # List/create integrations
│   │   ├── projects/           # Project management
│   │   │   ├── [projectId]/    # Project operations
│   │   │   └── route.ts        # List/create projects
│   │   ├── signup/             # User registration
│   │   └── support/            # Support/feedback
│   ├── chat/                    # Chat interface pages
│   │   ├── [id]/               # Individual chat page
│   │   ├── shared/             # Shared chat viewer
│   │   └── page.tsx            # Chat home
│   ├── projects/                # Project pages
│   │   └── [projectId]/        # Project detail page
│   ├── login/                   # Login page
│   ├── signup/                  # Signup page
│   ├── forgot-password/         # Password reset request page
│   ├── reset-password/          # Password reset page
│   ├── tools/                   # AI Tools system
│   │   ├── index.ts            # Tool loader
│   │   ├── types.ts            # Tool interfaces
│   │   ├── chat-memory-search.ts # Mem0 integration
│   │   ├── web-search.ts       # SERP API tool
│   │   ├── web-scraper.ts      # Cheerio scraper
│   │   ├── mcp-tools.ts        # MCP integration loader
│   │   └── README.md           # Tools documentation
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage (redirects)
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── chat/                    # Chat-specific components
│   │   ├── chat-input.tsx      # Message input with attachments
│   │   ├── message-item.tsx    # Message rendering
│   │   └── message-actions.tsx # Message actions (copy, edit, etc.)
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── popover.tsx
│   │   └── scroll-area.tsx
│   ├── chat-interface.tsx       # Main chat component (52KB)
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── model-selector.tsx       # LLM model picker
│   ├── artifact-panel.tsx       # Code/artifact viewer
│   ├── code-block.tsx           # Syntax highlighted code
│   ├── tool-call-card.tsx       # Tool execution display
│   ├── add-integration-modal.tsx # OAuth integration setup
│   ├── add-to-project-modal.tsx # Add chat to project
│   ├── project-list.tsx         # Project sidebar
│   ├── project-modal.tsx        # Create/edit project
│   ├── search-chats.tsx         # Chat search
│   ├── settings-modal.tsx       # User settings
│   ├── user-integrations.tsx    # Integration management
│   └── providers.tsx            # Context providers
├── lib/                          # Utility functions and services
│   ├── mcp-tools/               # MCP tool implementations
│   │   ├── tool-executor.ts    # Generic MCP executor
│   │   ├── github.ts           # GitHub tools
│   │   ├── google-drive.ts     # Google Drive tools
│   │   ├── gmail.ts            # Gmail tools
│   │   ├── google-calendar.ts  # Calendar tools
│   │   ├── slack.ts            # Slack tools
│   │   ├── jira.ts             # Jira tools
│   │   └── notion.ts           # Notion tools
│   ├── auth.ts                  # NextAuth configuration
│   ├── db.ts                    # MongoDB connection
│   ├── chat-service.ts          # Chat persistence
│   ├── chat-storage.ts          # Chat state management
│   ├── memory-manager.ts        # Mem0 integration
│   ├── mem0-client.ts           # Mem0 API client
│   ├── llm-cache.ts             # Prompt caching
│   ├── artifact-detector.ts     # Code artifact detection
│   ├── ai-tools.ts              # AI tool utilities
│   ├── email.ts                 # Email sending
│   ├── refresh-token.ts         # OAuth token refresh
│   ├── integration-middleware.ts # Integration helpers
│   ├── client-validation.ts     # Form validation
│   ├── theme-context.tsx        # Theme management
│   ├── chat-layout-context.tsx  # Chat layout state
│   └── utils.ts                 # General utilities
├── models/                       # MongoDB Mongoose models
│   ├── User.ts                  # User schema
│   ├── Chat.ts                  # Chat schema
│   ├── Message.ts               # Message schema
│   ├── Project.ts               # Project schema
│   └── Integration.ts           # Integration schema
├── types/                        # TypeScript types
│   ├── global.d.ts              # Global type definitions
│   └── next-auth.d.ts           # NextAuth types
├── public/                       # Static assets
│   └── logos/                   # Integration logos
├── scripts/                      # Utility scripts
│   └── check-integrations.js    # OAuth integration checker
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
├── Dockerfile                    # Docker configuration
├── .dockerignore                 # Docker ignore rules
├── .gitignore                    # Git ignore rules
├── INTEGRATION_SETUP.md          # OAuth setup guide
├── REFACTORING_SUMMARY.md        # Code refactoring notes
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- API keys for LLM providers
- (Optional) API keys for integrations

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/badarivishal2002/Chat-bot.git
   cd Chat-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database

   # Authentication
   NEXTAUTH_SECRET=your-random-secret-here
   NEXTAUTH_URL=http://localhost:3000

   # LLM Providers (at least one required)
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_GENERATIVE_AI_API_KEY=...
   XAI_API_KEY=xai-...
   DEEPSEEK_API_KEY=sk-...

   # Conversation Memory
   MEM0_API_KEY=your-mem0-api-key

   # Web Search (optional)
   SERPAPI_KEY=your-serpapi-key

   # OAuth Integrations (optional)
   GITHUB_OAUTH_CLIENT_ID=...
   GITHUB_OAUTH_CLIENT_SECRET=...
   GOOGLE_OAUTH_CLIENT_ID=...
   GOOGLE_OAUTH_CLIENT_SECRET=...
   SLACK_OAUTH_CLIENT_ID=...
   SLACK_OAUTH_CLIENT_SECRET=...
   JIRA_OAUTH_CLIENT_ID=...
   JIRA_OAUTH_CLIENT_SECRET=...
   NOTION_OAUTH_CLIENT_ID=...
   NOTION_OAUTH_CLIENT_SECRET=...

   # Email (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@yourapp.com

   # Support Email
   SUPPORT_EMAIL_USER=support@yourapp.com
   SUPPORT_EMAIL_PASSWORD=your-support-password

   # Early Access (optional)
   EARLY_ACCESS_VERIFY_URL=https://yoursite.com/api/verify
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. **Create an account**: Go to `/signup` and register
2. **Login**: Use your credentials at `/login`
3. **Start chatting**: Click "New Chat" to begin
4. **Select a model**: Choose from GPT-4.1, Claude 4.5, Gemini, DeepSeek, or Grok
5. **Try tools**: Ask the AI to search the web or recall previous conversations
6. **(Optional) Add integrations**: Connect GitHub, Gmail, Slack, etc. in Settings

## Available AI Models

| Model | Provider | Best For | Speed | Cost |
|-------|----------|----------|-------|------|
| **GPT-4.1** | OpenAI | General purpose, balanced | Medium | Medium |
| **GPT-5** | OpenAI | Complex reasoning | Slower | High |
| **GPT-5.2** | OpenAI | Latest capabilities | Slower | High |
| **Claude 4.5 Sonnet** | Anthropic | Writing, analysis, coding | Fast | Medium |
| **Gemini 2.5 Flash** | Google | Quick tasks, simple queries | Very Fast | Low |
| **DeepSeek Chat** | DeepSeek | Cost-effective, coding | Fast | Very Low |
| **Grok 4.1 Reasoning** | xAI | Complex problem-solving | Medium | Medium |

All models support:
- Tool calling
- Multi-step reasoning
- Prompt caching (where available)
- Streaming responses

## AI Tools System

The application includes a modular tool system that extends the AI's capabilities:

### Built-in Tools

1. **chatMemorySearch** - Search conversation history semantically
   - Powered by Mem0 AI
   - Temporal awareness ("last week", "yesterday")
   - User-scoped memory

2. **webSearch** - Search the web for current information
   - SERP API integration
   - Returns titles, URLs, snippets
   - Source attribution

3. **webScraper** - Extract content from web pages
   - Cheerio-based parsing
   - CSS selector support
   - Metadata extraction

### MCP Integration Tools (OAuth Required)

4. **GitHub** - `github_list_repos`, `github_search_code`, `github_create_issue`, `github_get_user`
5. **Google Drive** - `drive_list_files`, `drive_search_files`, `drive_get_file_info`
6. **Gmail** - `gmail_list_messages`, `gmail_search_messages`, `gmail_send_message`, `gmail_get_unread_count`
7. **Slack** - `slack_list_channels`, `slack_send_message`, `slack_search_messages`, `slack_list_users`
8. **Google Calendar** - `calendar_list_events`, `calendar_create_event`, `calendar_search_events`
9. **Jira** - `jira_list_projects`, `jira_list_issues`, `jira_create_issue`, `jira_search_issues`
10. **Notion** - `notion_search`, `notion_list_pages`, `notion_create_page`, `notion_query_database`

See [app/tools/README.md](app/tools/README.md) for detailed tool documentation.

## Key Features Explained

### Multi-Step Reasoning
The AI can chain up to 15 tool calls in a single response, allowing complex workflows:
```
User: "Find recent AI news and summarize the top 3 articles"
→ AI uses webSearch
→ AI uses webScraper on each article
→ AI synthesizes results
```

### Conversation Memory
Powered by Mem0, the AI remembers context across chats:
```
User: "What did I say about my project deadline?"
→ AI searches conversation history semantically
→ Returns relevant snippets with timestamps
```

### Prompt Caching
Reduces costs by caching system prompts:
- **Claude**: Ephemeral cache control (5min)
- **OpenAI GPT-5**: 24-hour retention (75% discount)
- **Grok**: Automatic caching with conversation ID
- **Gemini**: Implicit caching (75% discount)
- **DeepSeek**: Disk caching (90% discount)

### Artifact Detection
Automatically detects and renders code:
- **HTML**: Live preview in iframe
- **React**: Interactive component rendering
- **SVG**: Vector graphics display
- **Mermaid**: Diagram rendering
- **Code blocks**: Syntax highlighting (50+ lines)

### Message Editing
Edit previous messages and regenerate responses:
1. Click "Edit" on any message
2. Modify the text
3. Messages after the edit are removed
4. AI generates a new response

### Chat Sharing
Share conversations publicly:
1. Click "Share" button
2. Copy the secure link
3. Recipients can view (read-only)
4. Revoke access anytime

## Database Schema

### Collections

**Users**
- `email`, `password` (hashed), `name`
- `plan`, `isInTrial`, `trialEndDate`
- `earlyAccessApproved`
- Password reset tokens

**Chats**
- `chat_id` (unique), `user_id`, `title`
- `project_id` (optional)
- `isShared`, `shareToken`, `sharedAt`
- Timestamps

**Messages**
- `chat_id`, `user_id`, `role` (user/assistant/system)
- `content`, `sources`
- `edited`, `edited_at`
- Timestamps

**Projects**
- `project_id`, `user_id`, `name`
- `category`, `customCategory`
- `description`, `chat_ids`
- Timestamps

**Integrations**
- `integration_id`, `user_id`, `type`
- `name`, `description`, `enabled`
- `config`, `credentials` (encrypted)
- `last_used`

### Indexes
- `(user_id, chat_id)` on Chats
- `(chat_id, timestamp)` on Messages
- `(user_id, type)` on Integrations
- `email` (unique) on Users

## API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/signup` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Chat
- `POST /api/chat` - Send message, get streaming response
- `GET /api/chat/history` - Get user's chat list
- `GET /api/chat/[chatId]/messages` - Get chat messages
- `POST /api/chat/[chatId]/title` - Update chat title
- `DELETE /api/chat/[chatId]` - Delete chat
- `POST /api/chat/[chatId]/share` - Share chat
- `GET /api/chat/shared/[shareToken]` - View shared chat

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/[projectId]` - Get project details
- `PUT /api/projects/[projectId]` - Update project
- `DELETE /api/projects/[projectId]` - Delete project
- `GET /api/projects/[projectId]/chats` - Get project chats

### Integrations
- `GET /api/integrations` - List user integrations
- `POST /api/integrations` - Create integration
- `POST /api/integrations/auth/initiate/[provider]` - Start OAuth flow
- `GET /api/integrations/auth/callback/[provider]` - OAuth callback
- `POST /api/integrations/[integrationId]/refresh` - Refresh token
- `DELETE /api/integrations/[integrationId]` - Delete integration
- `POST /api/integrations/refresh-all` - Refresh all expired tokens

### Support
- `POST /api/support` - Submit support request

## OAuth Integration Setup

To enable MCP tools, you need to set up OAuth apps. See [INTEGRATION_SETUP.md](INTEGRATION_SETUP.md) for detailed instructions on:

1. Creating OAuth apps for each provider
2. Setting up redirect URIs
3. Configuring environment variables
4. Testing integrations

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**: Your code is already in the repo
2. **Import to Vercel**: Connect your GitHub repository
3. **Add environment variables**: Add all variables from `.env`
4. **Deploy**: Vercel will build and deploy automatically

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/badarivishal2002/Chat-bot)

### Docker

```bash
# Build the image
docker build -t metawurks-agent .

# Run the container
docker run -p 3000:3000 --env-file .env metawurks-agent
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Upcoming Features (Roadmap)

### Feature 1: Advanced Agent Capabilities

#### 1. Code Sandbox
- Execute Python, JavaScript, TypeScript, Bash
- File creation and manipulation (PPT, DOC, PDF)
- Internet access from sandbox
- Resource limits and security

#### 2. Infinite Context
- Automatic conversation summarization
- Hierarchical context storage
- Smart retrieval from Mem0
- Token optimization

#### 3. Subagent System
- Task decomposition
- Specialized agent spawning (Research, Code, Data, Document, Integration)
- Multi-agent orchestration
- Result aggregation

#### 4. Skills Framework
- Document generation (PowerPoint, Word, PDF)
- Data analysis and visualization
- Web automation
- Code operations (debugging, testing, refactoring)
- Custom user-defined skills

#### 5. LLM Ensemble
- Automatic model selection based on task complexity
- Cost optimization
- Performance tracking
- Fallback mechanisms

See the detailed [Implementation Plan](#) for phases and timeline.

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check `MONGODB_URI` in `.env`
- Verify network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**LLM API Errors**
- Verify API keys are correct
- Check API key permissions
- Monitor rate limits

**OAuth Integration Not Working**
- Check redirect URIs match exactly
- Verify OAuth credentials in `.env`
- Run `npm run check-integrations`
- See [INTEGRATION_SETUP.md](INTEGRATION_SETUP.md)

**Chat Not Loading**
- Check browser console for errors
- Verify user is authenticated
- Check MongoDB connection

**Tools Not Being Used**
- Check console for tool loading errors
- Verify required API keys (SERPAPI_KEY, MEM0_API_KEY)
- Update system prompt if needed

### Development Tips

- **Clear cache**: Delete `.next` folder and restart
- **Check logs**: Monitor console for `[TOOLS]`, `[MCP]`, `[MEMORY]` logs
- **Test tools**: Use specific prompts to trigger tools
- **Debug auth**: Check NextAuth logs in terminal

## Performance Optimization

- **Prompt caching**: Reduces LLM costs by 75-90%
- **MongoDB indexes**: Fast query performance
- **Lazy loading**: MCP tools loaded only if user has integrations
- **Streaming**: Real-time response display
- **Mem0 fire-and-forget**: Non-blocking memory storage

## Security

- **JWT sessions**: Secure stateless authentication
- **Password hashing**: bcrypt with salt
- **OAuth tokens**: Encrypted in database (production)
- **Input validation**: Server-side and client-side
- **Rate limiting**: Middleware protection
- **Secure sharing**: Unique tokens for shared chats
- **Environment variables**: Never committed to Git

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Submit a pull request

### Development Guidelines

- Follow existing code patterns
- Use TypeScript for type safety
- Add comprehensive error handling
- Update documentation (README, tool docs)
- Test thoroughly before committing
- Use conventional commit messages

## License

MIT License - see LICENSE file for details

## Support

For support, questions, or feature requests:
- Open an issue on [GitHub](https://github.com/badarivishal2002/Chat-bot/issues)
- Check the documentation in this README
- Review [app/tools/README.md](app/tools/README.md) for tool-specific help
- See [INTEGRATION_SETUP.md](INTEGRATION_SETUP.md) for OAuth setup

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Memory by [Mem0 AI](https://mem0.ai/)
- Authentication by [NextAuth](https://next-auth.js.org/)
- Icons by [Lucide](https://lucide.dev/)

---

**Built with the vision of creating an intelligent, context-aware AI agent that learns and adapts to user needs.**
