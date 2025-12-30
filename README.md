# AI Chat Application

A modern AI chat application similar to Glean AI or NotebookLM, built with Next.js and the Vercel AI SDK.

## Features

### Core Chat Features
- **Real-time AI Chat**: Powered by OpenAI GPT models with streaming responses
- **Interactive Chat Interface**: Modern chat UI with typing indicators and message history
- **Collapsible Sidebar**: Expandable/collapsible navigation for better screen utilization
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices

### Authentication System
- **Login/Early Access Pages**: Complete authentication UI with form validation
- **Demo Mode**: Bypass authentication for easy testing and demonstration
- **Seamless Navigation**: Automatic routing between auth and chat interfaces

### File Management System
- **Advanced Upload Modal**: Drag & drop file upload with multiple source options
- **File Storage**: Persistent file storage using localStorage (demo) with metadata
- **Document Discovery**: Comprehensive file management and search interface
- **File Type Support**: PDF, DOCX, Images, Videos, Markdown, and Text files
- **Cloud Integration Placeholders**: Google Drive and OneDrive integration ready

### Enhanced User Interface
- **Modern Sidebar**: Organized sections for Chat History, Discover, and Upload with scroll support
- **File Management**: Upload, view, delete, and organize documents
- **Responsive Upload Modal**: Works seamlessly across all device sizes
- **Visual File Icons**: Color-coded icons for different file types
- **Real-time Updates**: Instant UI updates when files are uploaded or deleted
- **Interactive Chat Management**: Create, delete, and switch between multiple chat sessions
- **Confirmation Dialogs**: User-friendly prompts for destructive actions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **AI/ML**: Vercel AI SDK, OpenAI GPT-3.5-turbo
- **Styling**: Tailwind CSS, shadcn/ui components
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file and add your API keys:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

6. **Start using the app**
   - You'll be redirected to the login page
   - Enter any email/password (demo mode) to access the chat
   - Create new chats using the "New Chat" button
   - Upload files via the sidebar or discover page
   - Switch between different chat conversations
   - Delete chats using the trash icon in sidebar or delete button in chat header
   - Start chatting with the AI assistant

## Project Structure

```
ai-chat-app/
├── app/                    # Next.js App Router
│   ├── login/             # Authentication login page
│   ├── early-access/      # Early Access request page
│   ├── signup/            # (Disabled) legacy registration page
│   ├── chat/              # Main chat interface
│   ├── discover/          # Document management and file explorer
│   ├── api/chat/          # Chat API endpoint with AI integration
│   ├── layout.tsx         # Root layout with global styles
│   ├── page.tsx           # Root redirect to login
│   └── globals.css        # Global styles and design system
├── components/            # React components
│   ├── ui/               # shadcn/ui reusable components
│   │   ├── button.tsx    # Button component with variants
│   │   ├── input.tsx     # Input component with styling
│   │   ├── dialog.tsx    # Modal/dialog component
│   │   └── scroll-area.tsx # Custom scroll area component
│   ├── sidebar.tsx       # Collapsible navigation sidebar
│   ├── chat-interface.tsx # Main chat component with AI integration
│   └── upload-modal.tsx  # File upload modal with drag & drop
├── lib/                  # Utility functions and services
│   ├── utils.ts         # General utility functions
│   └── file-storage.ts  # File management and storage utilities
└── public/              # Static assets
```

## Key Components

### Authentication System
- **Login Page** (`/login`): Email/password authentication with demo mode
- **Early Access Page** (`/early-access`): Controlled onboarding with reCAPTCHA
- **Auto-redirect**: Seamless navigation between auth and main app

### Chat Interface
- **Real-time AI messaging**: Streaming responses with Vercel AI SDK
- **File integration**: Upload documents directly in chat
- **Message history**: Persistent chat sessions and context
- **Responsive design**: Optimized for all screen sizes
- **Chat Management**: Create new chats, delete existing ones, and switch between conversations
- **Dynamic Headers**: Chat titles dynamically update based on selected conversation

### Advanced Sidebar Navigation
- **Collapsible design**: Toggle between expanded and collapsed states
- **Discover section**: Quick access to file management
- **Upload sources**: Direct file upload from sidebar
- **Chat history**: Scrollable list of previous conversations with delete options
- **Account management**: User profile and settings
- **Active chat highlighting**: Visual indication of currently selected chat
- **Individual chat actions**: Delete buttons with confirmation for each chat

### Enhanced Discover Page
- **File upload modal**: Drag & drop interface with multiple source options
- **File management**: View, search, filter, and delete uploaded documents
- **Multiple view modes**: Grid and list views for different preferences
- **Real-time updates**: Instant refresh when files are uploaded/deleted
- **Source filtering**: Filter by upload source (Local, Google Drive, OneDrive)
- **File type icons**: Visual indicators with color coding

### Upload System
- **Multi-source support**: Local files, Google Drive, OneDrive (placeholders)
- **File type validation**: Support for PDF, DOCX, images, videos, markdown, text
- **Drag & drop interface**: Intuitive file selection with visual feedback
- **Progress indicators**: Loading states and success/error messages
- **Persistent storage**: Files saved with metadata for future access

## API Routes

### `/api/chat`
Handles chat messages and AI responses using the Vercel AI SDK and OpenAI. Features include:
- Streaming text responses
- Message context management
- Error handling and fallbacks
- Custom system prompts for document-aware AI assistance

## Customization

### Adding New AI Providers
To use Claude instead of OpenAI, update `app/api/chat/route.ts`:

```typescript
import { anthropic } from '@ai-sdk/anthropic'

const result = await streamText({
  model: anthropic('claude-3-sonnet-20240229'),
  // ... rest of config
})
```

### Styling
The application uses Tailwind CSS with custom CSS variables for theming. Modify `app/globals.css` to customize colors and styling.

### Document Processing
Currently includes placeholders for document parsing. Integrate with services like:
- Supabase for storage
- Pinecone for vector embeddings
- PDF.js for PDF parsing

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t ai-chat-app .
docker run -p 3000:3000 ai-chat-app
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for AI chat functionality)
- `ANTHROPIC_API_KEY`: Alternative Anthropic API key (optional)
- `DATABASE_URL`: Database connection string (for production)
- `NEXTAUTH_SECRET`: NextAuth secret for authentication (for production)
- `EARLY_ACCESS_VERIFY_URL`: Absolute URL (e.g., `https://landing.metawurks.com/api/early-access/verify`) that validates invite `token`/`email` pairs before signup

### Demo Mode
The application runs in demo mode by default, which means:
- Authentication is bypassed (any email/password works)
- Files are stored in localStorage
- No external API keys required for basic functionality (except OpenAI for chat)

## Version History

### Version 2.1 (Latest)
**Major Updates & New Features:**

#### 🔐 Authentication System
- Added complete login/early access pages with form validation
- Implemented demo mode for easy testing
- Auto-redirect functionality between auth and main app

#### 📁 Advanced File Management
- **Upload Modal**: Responsive drag & drop interface
- **File Storage System**: Persistent storage with metadata
- **Multi-source Support**: Local files, Google Drive, OneDrive placeholders
- **File Type Detection**: Support for PDF, DOCX, images, videos, markdown, text
- **Real-time Updates**: Instant UI refresh on file operations

#### 💬 Enhanced Chat Management
- **Dynamic Chat Creation**: New Chat button creates actual chat sessions with unique IDs
- **Chat History Scroll**: Improved scrolling in sidebar with proper height constraints
- **Delete Functionality**: Individual delete buttons for each chat in sidebar and main interface
- **Active Chat Highlighting**: Current chat is highlighted in the sidebar
- **Dynamic Chat Titles**: Chat interface shows actual chat titles from sidebar

#### 🎨 Enhanced User Interface
- **Collapsible Sidebar**: Space-efficient navigation design
- **Responsive Upload Modal**: Works seamlessly across all screen sizes
- **Color-coded File Icons**: Visual file type identification
- **Improved Layout**: Reordered sidebar sections for better UX
- **Confirmation Dialogs**: Safety prompts for destructive actions

#### 🛠️ Technical Improvements
- **File Storage Utility**: Complete CRUD operations for file management
- **Enhanced Components**: Updated UI components with better accessibility
- **Mobile Optimization**: Improved responsive design for all devices
- **Error Handling**: Better user feedback and error management
- **Hydration Fixes**: Resolved Next.js server-side rendering issues
- **State Management**: Proper synchronization between sidebar and chat interface

### Version 2.0
- Authentication system with login/early access pages
- Advanced file management with upload modal
- Responsive design improvements
- File storage utility implementation
- Enhanced UI components

### Version 1.0 (Initial Release)
- Basic AI chat functionality with OpenAI integration
- Simple file upload capabilities
- Discover page for document management
- Basic sidebar navigation
- Core chat interface with message history

## Troubleshooting

### Hydration Errors
If you encounter Next.js hydration errors:
- The app includes client-side rendering fixes to prevent server/client mismatches
- Loading states are implemented to ensure consistent rendering
- All interactive components are properly hydrated before user interaction

### Common Issues & Fixes
- **Chat not creating**: Ensure you're clicking "New Chat" button, not just typing
- **Delete buttons not visible**: Hover over chat items in sidebar to see delete options
- **Upload modal not opening**: Check that the "Upload Sources" button in sidebar is clicked
- **Files not appearing**: Use the refresh button in discover page after uploading

### Development Notes
- Demo mode bypasses authentication for easy testing
- Files are stored in localStorage for demo purposes
- Chat history persists until browser data is cleared
- All API calls require OPENAI_API_KEY environment variable

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Check the documentation in the README
- Review the component examples in the codebase