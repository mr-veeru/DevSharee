# DevShare

A comprehensive social platform for developers to create, share, and interact with projects. Built with Flask, MongoDB Atlas, and JWT authentication.

## Features

### Core Functionality
- **User Authentication** - JWT-based auth with registration, login, logout, and profile management
- **Project Posts** - Create, read, update, and delete project posts with detailed information
- **File Uploads** - Real file upload system supporting multiple file types stored in GridFS (16MB max)
- **Post Discovery** - Browse all posts with pagination, search, and filtering capabilities
- **Health Monitoring** - Comprehensive health checks for database, JWT, and Flask configuration

### Technical Features
- **Global Error Handling** - Centralized error management with consistent responses
- **Input Validation** - Comprehensive validation with detailed error messages
- **File Security** - Secure file uploads with type and size validation
- **Database Integration** - MongoDB Atlas with atomic operations
- **API Documentation** - Complete Swagger UI documentation
- **Logging** - Structured logging for debugging and monitoring

## Setup

### Prerequisites
- Python 3.8+
- MongoDB Atlas account (free tier available)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd DevSharee
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up MongoDB Atlas:**
   - Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a database user with read/write permissions
   - Get your connection string

4. **Configure environment variables:**
   ```bash
   copy .env.example .env
   ```
   
   Update `.env` with your actual values:
   ```env
   SECRET_KEY=your_secret_key_here
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/devshare?retryWrites=true&w=majority&appName=DevShare
   JWT_SECRET_KEY=your_jwt_secret_here
   ```

5. **Run the application:**
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Documentation

- **Swagger UI**: `http://localhost:5000/api/swagger-ui/`
- **API Spec**: `http://localhost:5000/api/swagger.json`
- **Health Check**: `http://localhost:5000/api/health/`

## API Architecture

The API is organized into logical modules for better maintainability:

### **Core Modules:**
- **`/auth`** - User authentication and profile management
- **`/health`** - System health monitoring and diagnostics
- **`/posts`** - Post creation with comprehensive file upload support
- **`/social`** - Social interactions (likes, comments, replies)
- **`/feed`** - Post discovery with advanced filtering and search
- **`/profile`** - User-specific post management (view, edit, delete)


## API Endpoints

### Health Check
- `GET /` - Basic health check and API information
- `GET /api/health/` - Comprehensive health check (database, JWT, Flask config)

### Authentication
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User login (username/email + password)
- `POST /api/auth/logout` - User logout (token blacklisting)
- `POST /api/auth/refresh` - Refresh access token

### Posts Management
- `POST /api/posts` - Create new project post with file uploads
  - **Form Data**: `title`, `description`, `tech_stack[]` (array of strings), `github_link`, `files[]` (file uploads)

### Feed (Discover Posts)
- `GET /api/feed` - Get all posts from all users with pagination and search
  - **Query Parameters**:
    - `page` - Page number (default: 1)
    - `limit` - Posts per page (default: 10, max: 50)
    - `sort` - Sort order: `created_at_desc`, `created_at_asc`, `title_asc`, `title_desc`
    - `tech_stack` - Filter by technology
    - `search` - Search in title and description
- `GET /api/feed/<post_id>` - Get single post details by ID

### User Profile Management
- `GET /api/profile` - Get user profile with post count
- `GET /api/profile/posts` - Get user's own posts (with pagination)
- `GET /api/profile/posts/<post_id>` - Get specific post details
- `PUT /api/profile/posts/<post_id>` - Edit user's own post
- `DELETE /api/profile/posts/<post_id>` - Delete the user's own post
- `GET /api/profile/posts/<post_id>/files/<file_id>` - Download files from user's posts


## Project Structure

```
DevSharee/
├── 📄 app.py                   # Main Flask application
├── 📄 requirements.txt         # Python dependencies
├── 📄 .env                     # Environment variables (not in git)
├── 📄 .env.example             # Environment variables template
├── 📄 .gitignore               # Git ignore rules
├── 📄 README.md                # Project documentation
└── 📁 src/
    ├── 📄 config.py            # Flask configuration
    ├── 📄 extensions.py        # Flask extensions (MongoDB, JWT, API)
    ├── 📄 logger.py            # Logging configuration
    ├── 📁 utils/
    │   ├── 📄 __init__.py      # Utility exports
    │   └── 📄 file_utils.py    # File upload/download utilities
    └── 📁 routes/
        ├── 📄 __init__.py      # Global error handling + exports
        ├── 📄 auth.py          # Authentication routes
        ├── 📄 health.py        # Health check routes
        ├── 📄 posts.py         # Post creation with file uploads
        ├── 📄 social.py        # Social interactions (likes, comments, replies)
        ├── 📄 feed.py          # Post discovery and retrieval
        └── 📄 profile.py       # User profile and post management
```
