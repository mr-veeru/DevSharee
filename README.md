# DevShare - Social Platform for Developers

A full-stack social platform for developers to create, share, and interact with projects. Built with Flask backend and React TypeScript frontend.

## Tech Stack

- **Backend**: Flask, MongoDB, JWT, Flask-RESTX, Flask-CORS, Flask-Limiter
- **Frontend**: React, TypeScript, React Icons, React Router DOM

## Project Structure

```
DevShare/
├── 📁 backend/                         # Flask REST API
│   ├── 📄 app.py                       # Main application entry point
│   ├── 📄 requirements.txt             # Python dependencies
│   ├── 📄 .env.example                 # Environment variables template
│   ├── 📄 API.md                       # Complete API documentation
│   └── 📁 src/
│       ├── 📄 config.py                # Environment configuration
│       ├── 📄 extensions.py            # Flask extensions (MongoDB, JWT, API, Limiter)
│       ├── 📄 logger.py                # Logging configuration
│       ├── 📁 models/                  # API models (Flask-RESTx)
│       │   ├── 📄 __init__.py          # Models package initialization
│       │   ├── 📄 post_models.py       # Post response models
│       │   ├── 📄 auth_models.py       # Authentication models
│       │   ├── 📄 social_models.py     # Social interaction models
│       │   └── 📄 profile_models.py    # Profile models
│       ├── 📁 routes/                  # API endpoints
│       │   ├── 📄 __init__.py          # Routes initialization & error handlers
│       │   ├── 📄 auth.py              # Authentication routes
│       │   ├── 📄 health.py            # Health check routes
│       │   ├── 📄 posts.py             # Posts creation routes
│       │   ├── 📄 profile.py           # Profile management routes
│       │   ├── 📄 profile_posts.py     # Profile post management routes
│       │   ├── 📄 feed.py              # Feed routes
│       │   ├── 📄 notifications.py     # Notifications routes
│       │   └── 📁 social/              # Social interactions
│       │       ├── 📄 __init__.py      # Social namespace
│       │       ├── 📄 likes.py         # Post/comment/reply likes
│       │       ├── 📄 comments.py      # Post comments
│       │       └── 📄 replies.py       # Comment replies
│       └── 📁 utils/                   # Utility functions
│           ├── 📄 __init__.py          # Utils package initialization
│           ├── 📄 file_utils.py        # File upload utilities (GridFS)
│           ├── 📄 post_utils.py        # Post-related utilities (pagination, sorting)
│           └── 📄 social_utils.py      # Social interaction utilities
├── 📁 frontend/                        # React TypeScript App
│   ├── 📁 src/
│   │   ├── 📄 App.tsx                  # Main application component
│   │   ├── 📄 index.tsx                # Application entry point
│   │   ├── 📄 index.css                # Global styles with theme variables
│   │   ├── 📁 pages/                   # Page components
│   │   │   ├── 📁 auth/                # Authentication pages
│   │   │   │   ├── 📄 Login.tsx        # Login component
│   │   │   │   ├── 📄 Signup.tsx       # Signup component
│   │   │   │   └── 📄 Auth.css         # Auth component styles
│   │   │   ├── 📁 CreatePost/          # Create post page
│   │   │   │   ├── 📄 CreatePost.tsx   # Post creation form component
│   │   │   │   └── 📄 CreatePost.css   # Create post styles
│   │   │   └── 📁 Feed/                # Feed page
│   │   │       ├── 📄 Feed.tsx         # Feed component with search and filters
│   │   │       └── 📄 Feed.css         # Feed page styles
│   │   ├── 📁 components/              # Reusable components
│   │   │   ├── 📁 common/              # Shared/common components
│   │   │   │   └── 📄 common.css       # Common styles (logo, etc.)
│   │   │   ├── 📁 theme/               # Theme-related components
│   │   │   │   ├── 📄 ThemeToggle.tsx  # Theme context & toggle
│   │   │   │   └── 📄 ThemeToggle.css  # Theme toggle styles
│   │   │   ├── 📁 toast/               # Toast notification components
│   │   │   │   ├── 📄 Toast.tsx        # Toast context & component
│   │   │   │   └── 📄 Toast.css        # Toast styles
│   │   │   ├── 📁 navbar/              # Navigation bar component
│   │   │   │   ├── 📄 Navbar.tsx       # Responsive navbar (desktop & mobile)
│   │   │   │   └── 📄 Navbar.css       # Navbar styles
│   │   │   ├── 📁 letterAvatar/        # Avatar component
│   │   │   │   ├── 📄 LetterAvatar.tsx # Letter-based avatar component
│   │   │   │   └── 📄 LetterAvatar.css # Avatar styles
│   │   │   ├── 📁 filePreview/         # File preview component
│   │   │   │   ├── 📄 FilePreview.tsx  # File display with icon and info
│   │   │   │   └── 📄 FilePreview.css  # File preview styles
│   │   │   ├── 📁 postCard/            # Post card component
│   │   │   │   ├── 📄 PostCard.tsx     # Post display with edit/delete/share
│   │   │   │   └── 📄 PostCard.css     # Post card styles
│   │   │   └── 📁 social/              # Social interaction components
│   │   │       ├── 📄 Likes.tsx        # Like/unlike component with likes list
│   │   │       └── 📄 Likes.css        # Likes component styles
│   │   ├── 📁 hooks/                   # Custom React hooks
│   │   │   └── 📄 useAuth.ts           # Authentication hook
│   │   ├── 📁 types/                   # TypeScript type definitions
│   │   │   └── 📄 index.ts             # Shared type interfaces (User, Post)
│   │   ├── 📁 utils/                   # Utility functions
│   │   │   ├── 📄 token.ts             # Token management (storage, refresh, API calls)
│   │   │   ├── 📄 auth_utils.tsx       # Auth UI components & utilities
│   │   │   ├── 📄 fileUtils.tsx        # File handling utilities (icons, size, filename)
│   │   │   └── 📄 date.ts              # Date/time formatting utilities
│   ├── 📄 package.json                 # Frontend dependencies
│   └── 📄 tsconfig.json                # TypeScript configuration
├── 📄 .gitignore                       # Git ignore rules
└── 📄 README.md                        # Project documentation
```

## Quick Start

### Backend (Flask API)

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and secrets
   ```

3. **Run the application:**
   ```bash
   python app.py  # Runs on http://localhost:5000
   ```

4. **Access API docs:**
   - Swagger UI: http://localhost:5000/api/swagger-ui/
   - Health Check: http://localhost:5000/api/health/

### Frontend (React TypeScript)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm start  # Runs on http://localhost:3000
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## API Documentation

For complete API documentation, see [API.md](backend/API.md)

## Current Status

**Backend:** ✅ Authentication, Posts, Feed, Profile, Social Interactions, File Management, Token Blacklist Cleanup  
**Frontend:** 
- ✅ Authentication UI (Login & Signup pages)
- ✅ Token Management (Access & Refresh tokens with automatic refresh)
- ✅ Theme Toggle (Light/Dark mode with persistence)
- ✅ Toast Notifications (Success/Error messages with auto-dismiss)
- ✅ Navigation Bar (Responsive desktop & mobile navbar with profile dropdown)
- ✅ Letter Avatar (User avatar component with deterministic colors)
- ✅ Create Post (Form for creating posts with file uploads and tech stack tags)
- ✅ Feed Page (Complete implementation with all features)
- ✅ Post Card (Post display component with inline editing, delete, share, file downloads)
- ✅ File Preview (File display component with icons and metadata)
- ✅ File Utilities (Icon detection, size formatting, filename extraction)
- ✅ Date Utilities (Relative time formatting and display date formatting)
- ✅ TypeScript Types (Shared type definitions for User, Post, Like, UserInfo, and other entities)
- ✅ Social Interactions - Likes (Like/unlike posts, view likes list with user avatars)
- ✅ Responsive Design (Mobile-friendly UI with proper navbar spacing)
- ✅ Code Refactoring (Shared components, common CSS, utility functions)
**In Progress:** Profile Page, Notifications (backend + frontend), Social Interactions (frontend - comments, replies)

## Features

### Frontend Features
- **Authentication**: Secure login and signup with JWT token management
- **Navigation Bar**: Responsive navigation with desktop top bar and mobile bottom bar, profile dropdown menu
- **Feed Page**: Main feed displaying posts
- **Letter Avatar**: User avatar component displaying initials with deterministic color palette
- **Create Post**: Form for creating posts with title, description, tech stack tags, GitHub links, and file uploads
- **Post Card**: Comprehensive post display component
- **File Preview**: Component for displaying file information with icons, size, and download/remove actions
- **File Utilities**: Icon detection for various file types, file size formatting, and filename extraction
- **Date Utilities**: Relative time formatting (e.g., "5 min ago", "2h ago") and display date formatting
- **TypeScript Types**: Shared type definitions for type safety across components (User, Post, Like, UserInfo)
- **Social Interactions - Likes**: Like/unlike posts with visual feedback
- **Theme Toggle**: Light and dark mode with localStorage persistence
- **Toast Notifications**: Global success/error notifications with automatic dismissal
- **Responsive Design**: Mobile-friendly UI with smooth transitions and proper navbar spacing
- **Form Validation**: Client-side validation with error handling
- **Password Visibility Toggle**: Enhanced UX for password fields
- **Code Organization**: Shared components, common CSS styles, reusable utility functions

### Backend Features
- **RESTful API**: Complete REST API with Flask-RESTX
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Token Blacklist**: JWT blacklisting with automatic cleanup of expired entries
- **File Management**: GridFS-based file upload and download
- **Social Interactions**: Likes, comments, and replies system
- **Profile Management**: User profiles with post management
- **Cascade Deletion**: Complete data cleanup on account/post deletion
- **Authorization**: JWT authentication with rotational refresh token 

## Use Cases

- **Developer Portfolios**: Showcase projects with code and documentation
- **Tech Communities**: Share knowledge and collaborate
- **Project Discovery**: Find interesting projects by technology stack
- **Social Learning**: Learn from others' implementations
- **Team Collaboration**: Share work-in-progress projects

## 📞 Contact

**Bannuru Veerendra**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mr-veeru)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/veerendra-bannuru-900934215)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mr.veeru68@gmail.com)
