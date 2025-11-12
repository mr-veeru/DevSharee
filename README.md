# DevShare - Social Platform for Developers

A full-stack social platform for developers to create, share, and interact with projects. Built with Flask backend and React TypeScript frontend.

## Tech Stack

- **Backend**: Flask, MongoDB, JWT, Flask-RESTX, Flask-CORS, Flask-Limiter
- **Frontend**: React TypeScript (coming soon)

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
│       ├── 📁 routes/                  # API endpoints
│       │   ├── 📄 __init__.py          # Routes initialization & error handlers
│       │   ├── 📄 auth.py              # Authentication routes
│       │   ├── 📄 health.py            # Health check routes
│       │   ├── 📄 posts.py             # Posts routes
│       │   ├── 📄 profile.py           # Profile routes
│       │   ├── 📄 feed.py              # Feed routes
│       │   └── 📄 notifications.py     # Notifications routes
│       └── 📁 utils/                   # Utility functions
│           ├── 📄 __init__.py          # Utils package initialization
│           └── 📄 file_utils.py        # File upload utilities (GridFS)
├── 📁 frontend/                        # React TypeScript App (coming soon)
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

## API Documentation

For complete API documentation, see [API.md](backend/API.md)

## Current Status

**Backend Setup Complete**
- Flask application with modular structure
- MongoDB database configured
- JWT authentication (register, login, logout, refresh) with token blacklist
- Health check endpoint
- Posts creation endpoint with file uploads (GridFS)
- API documentation (Swagger) enabled
- CORS configured
- Rate limiting enabled
- Logging system configured
- Global error handling implemented
- API namespaces initialized

**In Development**
- User profile endpoints
- Feed endpoints
- Notifications endpoints

## Use Cases

- **Developer Portfolios**: Showcase projects with code and documentation
- **Tech Communities**: Share knowledge and collaborate
- **Project Discovery**: Find interesting projects by technology stack
- **Social Learning**: Learn from others' implementations
- **Team Collaboration**: Share work-in-progress projects

## 📞 Contact

**Bannuru Veerendra**

<div align="center">
  <a href="https://github.com/mr-veeru">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <a href="https://www.linkedin.com/in/veerendra-bannuru-900934215">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
  <a href="mailto:mr.veeru68@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail"/>
  </a>
</div>
