# DevShare

> **A full-stack social platform for developers** to showcase projects, share code, and build communities. Built with modern technologies and best practices.

![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=flat&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=flat&logo=mongodb&logoColor=white)

---

## Overview

DevShare is a comprehensive social networking platform designed specifically for developers. It enables users to create posts, share code files, interact through likes/comments/replies, manage profiles, and receive real-time notifications—all with a beautiful, responsive UI and robust backend architecture.

### Key Highlights

- **Secure Authentication**: JWT-based auth with refresh tokens and automatic token rotation
- **Fully Responsive**: Mobile-first design with seamless desktop/mobile experience
- **Dark Mode**: Complete theme system with persistent user preferences
- **Real-time Notifications**: Smart notification system with duplicate prevention
- **File Management**: GridFS-based file upload/download with preview
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions
- **API Documentation**: Complete Swagger/OpenAPI documentation

---

## Tech Stack

### Backend
- **Framework**: Flask 2.0+ with Flask-RESTX
- **Database**: MongoDB with GridFS for file storage
- **Authentication**: JWT (Flask-JWT-Extended) with token blacklisting
- **Security**: Flask-CORS, Flask-Limiter for rate limiting
- **API Docs**: Swagger UI (Flask-RESTX)

### Frontend
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router DOM v6
- **Styling**: CSS3 with CSS Variables for theming
- **Icons**: React Icons
- **State Management**: React Hooks (useState, useEffect, useCallback)

---

## Architecture

```
DevShare/
├── backend/              # Flask REST API
│   ├── src/
│   │   ├── models/      # API models (Flask-RESTx)
│   │   ├── routes/      # API endpoints
│   │   │   └── social/  # Social interactions (likes, comments, replies)
│   │   └── utils/       # Utilities (file handling, notifications)
│   ├── app.py           # Application entry point
│   ├── .env             # Environment variables
│   └── API.md           # Complete API documentation
│
├── frontend/            # React TypeScript App
│   └── src/
│       ├── App.tsx      # Main application component
│       ├── pages/       # Page components (Feed, Profile, Notifications)
│       ├── components/ # Reusable components
│       ├── hooks/      # Custom React hooks
│       ├── utils/      # Utility functions
│       └── types/      # TypeScript definitions
│
└── README.md            # Project documentation
```

---

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

---

## API Documentation

Complete API documentation is available in [API.md](backend/API.md)

**Key Endpoints:**
- `POST /api/auth/login` - User authentication
- `GET /api/feed` - Get posts feed
- `POST /api/posts` - Create new post
- `GET /api/social/likes/<post_id>` - Get likes
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/mark_all_read` - Mark all as read

---

## Use Cases

- **Developer Portfolios**: Showcase projects with code and documentation
- **Tech Communities**: Share knowledge and collaborate
- **Project Discovery**: Find interesting projects by technology stack
- **Social Learning**: Learn from others' implementations
- **Team Collaboration**: Share work-in-progress projects

---

## Development Practices
- Modular Flask architecture
- TypeScript for safety
- Reusable components
- DRY utilities
- Robust error handling
- Rate limiting
- JWT token rotation
- Environment-based configs

---

<div align="center">

## 📞 Contact

**Bannuru Veerendra**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mr-veeru)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/veerendra-bannuru-900934215)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mr.veeru68@gmail.com)

---

**⭐ Star this repo if you find it helpful!**

</div>
