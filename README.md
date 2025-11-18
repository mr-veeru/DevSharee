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
│   │   ├── 📁 components/             # Reusable components
│   │   │   └── 📁 theme/               # Theme-related components
│   │   │       ├── 📄 ThemeToggle.tsx  # Theme context & toggle
│   │   │       └── 📄 ThemeToggle.css  # Theme toggle styles
│   │   ├── 📁 hooks/                   # Custom React hooks
│   │   │   └── 📄 useAuth.ts           # Authentication hook
│   │   ├── 📁 utils/                   # Utility functions
│   │   │   └── 📄 auth.tsx             # Auth utilities & shared components
│   │   └── 📁 types/                   # TypeScript type definitions
│   │       └── 📄 index.ts             # Shared types
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

**Backend:** Authentication, Posts, Feed, Profile, Social Interactions, File Management  
**Frontend:** 
- ✅ Authentication UI (Login & Signup pages)
- ✅ Token Management (Access & Refresh tokens)
- ✅ Theme Toggle (Light/Dark mode with persistence)
- ✅ Responsive Design
**In Progress:** Notifications (backend + frontend), Main App Features - Posts, Feed, Profile, Social Interactions, File Management (frontend)

## Features

### Frontend Features
- **Authentication**: Secure login and signup with JWT token management
- **Theme Toggle**: Light and dark mode with localStorage persistence
- **Responsive Design**: Mobile-friendly UI with smooth transitions
- **Form Validation**: Client-side validation with error handling
- **Password Visibility Toggle**: Enhanced UX for password fields

### Backend Features
- **RESTful API**: Complete REST API with Flask-RESTX
- **JWT Authentication**: Secure token-based authentication with refresh tokens
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
