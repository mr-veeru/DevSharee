# DevSharee - Social Platform for Developers

A comprehensive social platform for developers to create, share, and interact with projects. Built with Flask backend and React frontend with professional authentication system.

## Architecture Overview

```
DevSharee/
├── 📁 backend/                         # Flask REST API
│   ├── 📄 app.py                       # Main application entry
│   ├── 📄 requirements.txt             # Python dependencies
│   └── 📁 src/
│       ├── 📄 config.py                # Environment configuration
│       ├── 📄 extensions.py            # Flask extensions (MongoDB, JWT, API)
│       ├── 📄 logger.py                # Logging configuration
│       ├── 📁 routes/                  # API endpoints
│       │   ├── 📄 auth.py              # Authentication (register, login, logout, refresh)
│       │   ├── 📄 health.py            # System health monitoring
│       │   ├── 📄 posts.py             # Post creation with file uploads
│       │   ├── 📄 feed.py              # Public post discovery, search & file downloads
│       │   ├── 📄 profile.py           # User profile & post management
│       │   └── 📁 social/              # Social interactions
│       │       ├── 📄 __init__.py      # Social package initialization
│       │       ├── 📄 likes.py         # Post likes management
│       │       ├── 📄 comments.py      # Comment management
│       │       └── 📄 replies.py       # Reply management
│       │   ├── 📄 notifications.py     # Notifications 
│       └── 📁 utils/                   # Utility functions
│           ├── 📄 __init__.py          # Utils package initialization
│           ├── 📄 file_utils.py        # File upload/download helpers
│           └── 📄 social_utils.py      # Social interaction helpers
├── 📁 frontend/                        # React TypeScript App
│   ├── 📄 package.json                 # Node dependencies
│   └── 📁 src/
│       ├── 📄 App.tsx                  # App shell, routing, auth state
│       ├── 📄 index.css                # Global styles (top/bottom navbar spacing)
│       ├── 📄 index.tsx                # Application entry point
│       ├── 📁 types/                   # Shared TypeScript definitions
│       │   └── 📄 index.ts             # Centralized type definitions
│       ├── 📁 components/
│       │   ├── 📁 navbar/              # Responsive top/bottom navigation
│       │   │   ├── 📄 Navbar.tsx
│       │   │   └── 📄 Navbar.css
│       │   └── 📁 common/              # Reusable UI & shared styles
│       │       ├── 📄 PostCard.tsx     # Post display with social features
│       │       ├── 📄 PostCard.css     # Post styling
│       │       ├── 📄 LetterAvatar.tsx
│       │       ├── 📄 LetterAvatar.css
│       │       ├── 📄 ConfirmModal.tsx # Reusable confirmation modal (delete flows)
│       │       ├── 📄 Toast.tsx        # Toast notification component
│       │       ├── 📄 Toast.css        # Toast notification styles
│       │       ├── 📄 common.css       # Shared page styles (headers, buttons, shared textareas)
│       │       └── 📁 social/          # Social UI widgets
│       │           ├── 📄 Likes.tsx
│       │           ├── 📄 Likes.css
│       │           ├── 📄 Comments.tsx
│       │           ├── 📄 Comments.css
│       │           ├── 📄 Reply.tsx
│       │           └── 📄 Reply.css
│       ├── 📁 pages/                   # Route-level pages
│       │   ├── 📁 Feed/                # Main feed page
│       │   │   ├── 📄 Feed.tsx
│       │   │   └── 📄 Feed.css
│       │   ├── 📁 CreatePost/          # Post creation page
│       │   │   ├── 📄 CreatePost.tsx
│       │   │   └── 📄 CreatePost.css
│       │   ├── 📁 Notifications/       # Notifications page
│       │   │   ├── 📄 Notifications.tsx
│       │   │   └── 📄 Notifications.css
│       │   └── 📁 Profile/             # User profile page
│       │       ├── 📄 Profile.tsx
│       │       └── 📄 Profile.css
│       ├── 📁 auth/                    # Auth screens
│       │   ├── 📄 Login.tsx
│       │   ├── 📄 Signup.tsx
│       │   └── 📄 Auth.css
│       └── 📁 utils/                   # Frontend utilities
│           ├── 📄 auth.ts              # Authentication utilities
│           ├── 📄 date.ts              # Shared date formatting (relative & UI formats)
│           └── 📄 fileUtils.tsx        # File handling utilities & FilePreview component
├── 📄 .gitignore                       # Git ignore rules
└── 📄 README.md                        # Project documentation
```

## Quick Start

### Backend (Flask API)
```bash
cd backend
pip install -r requirements.txt
python app.py  # Runs on http://localhost:5000
```

### Frontend (React App)
```bash
cd frontend
npm install
npm start      # Runs on http://localhost:3000
```

## Complete API Reference

### **Authentication** (`/api/auth/`)
- `POST /register` - User registration with validation
- `POST /login` - User authentication (username/email + password)
- `POST /logout` - Token blacklisting
- `POST /refresh` - Refresh token rotation

### **Posts** (`/api/posts/`)
- `POST /` - Create post with file uploads (multipart/form-data)

### **Feed** (`/api/feed/`)
- `GET /` - Discover posts (pagination, search, filtering)
- `GET /<post_id>` - Get detailed post with social data
- `GET /posts/<post_id>/files/<file_id>` - Download files from posts

### **Notifications** (`/api/notifications/`)
- `GET /` - List notifications (paginated, newest first)
- `GET /unread_count` - Get unread notifications count
- `POST /mark_all_read` - Mark all as read
- `POST /<notif_id>/read` - Mark one as read
- `DELETE /<notif_id>` - Delete one notification
- `POST /clear_all` - Delete all notifications

### **Social Interactions**

#### **Likes** (`/api/social/likes/`)
- `POST /posts/<post_id>/like` - Toggle like/unlike
- `GET /posts/<post_id>/likes` - Get all likes with user info

#### **Comments** (`/api/social/comments/`)
- `POST /posts/<post_id>/comments` - Add comment
- `GET /posts/<post_id>/comments` - Get all comments with replies
- `PUT /<comment_id>` - Edit comment (author only)
- `DELETE /<comment_id>` - Delete comment + replies (author/post owner)
- `GET /<comment_id>/likes` - List who liked a comment
- `POST /<comment_id>/likes` - Toggle like/unlike a comment → `{ liked, likes_count }`

#### **Replies** (`/api/social/replies/`)
- `POST /comments/<comment_id>/replies` - Add reply
- `GET /comments/<comment_id>/replies` - Get all replies
- `PUT /<reply_id>` - Edit reply (author only)
- `DELETE /<reply_id>` - Delete reply (author/post owner)
- `GET /<reply_id>/likes` - List who liked a reply
- `POST /<reply_id>/likes` - Toggle like/unlike a reply → `{ liked, likes_count }`

### **Profile** (`/api/profile/`)
- `GET /` - Get user profile with stats
- `GET /posts` - Get user's posts (paginated)
- `GET /posts/<post_id>` - Get specific post details
- `PUT /posts/<post_id>` - Edit user's post
- `DELETE /posts/<post_id>` - Delete user's post
- `GET /posts/<post_id>/files/<file_id>` - Download files

### **System** (`/api/health/`)
- `GET /` - Comprehensive health check (database, JWT, config)

## Tech Stack

### **Backend**
- **Flask 2.3.3** - Web framework
- **MongoDB Atlas** - Cloud database with GridFS
- **PyMongo 4.6.0** - MongoDB driver
- **Flask-JWT-Extended** - JWT authentication
- **Flask-RESTX 1.3.0** - API documentation & validation
- **Flask-CORS 6.0.1** - Cross-origin resource sharing
- **Flask-Limiter 3.8.0** - Rate limiting

### **Frontend**
- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router 7** - Routing
- **React Icons** - Icon library
- **Native Fetch API** - HTTP client (no external dependencies)
- **CSS** - Modern styling with glass-morphism effects

## Frontend Folder Conventions

- `components/navbar/`: All navigation UI (desktop top bar + mobile bottom bar)
- `components/pages/*`: Route-level pages. Each page keeps only page-specific styles; shared styles live in `components/common/common.css`.
- `components/common/`: Reusable components and styles (e.g., `LetterAvatar`, `common.css`).
- `components/auth/`: Auth screens and styles.

## Environment Configuration

Create `backend/.env`:
```env
SECRET_KEY=your_secret_key_here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/devshare
JWT_SECRET_KEY=your_jwt_secret_here
```

## Features

- **Swagger Documentation**: `http://localhost:5000/api/swagger-ui/`
- **Health Monitoring**: `http://localhost:5000/api/health/`
- **Global Error Handling**: Consistent error responses
- **Rate Limiting**: Protection against abuse
- **File Security**: Type validation, size limits, and secure downloads
- **File Management**: Upload, download, and preview with centralized utilities
- **Centralized File Operations**: Professional file handling in `file_utils.py`
- **Cascade Deletion**: Automatic cleanup of related data
- **Notifications System**: Likes/comments/replies trigger notifications to owners
- **Comprehensive Logging**: Debug and monitoring support
- **Professional UI**: Clean, modern authentication forms with file preview

## Use Cases

- **Developer Portfolios**: Showcase projects with code and documentation
- **Tech Communities**: Share knowledge and collaborate
- **Project Discovery**: Find interesting projects by technology stack
- **Social Learning**: Learn from others' implementations
- **Team Collaboration**: Share work-in-progress projects
