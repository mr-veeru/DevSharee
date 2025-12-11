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

### Features

- **Authentication**: JWT-based auth with token blacklisting
- **Social Features**: Posts, likes, comments, replies with notifications
- **File Management**: Upload/download files with GridFS
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Theme toggle with persistent preferences
- **Rate Limiting**: Optional Redis support for distributed rate limiting
- **Database Indexes**: Optimized queries with automatic index creation
- **API Documentation**: Swagger UI for all endpoints

---

## Tech Stack

### Backend
- **Framework**: Flask 2.0+ with Flask-RESTX
- **Database**: MongoDB with GridFS for file storage
- **Authentication**: JWT with token blacklisting
- **Rate Limiting**: Flask-Limiter (Redis optional, falls back to in-memory)
- **Security**: CORS, security headers, request size limits
- **API Docs**: Swagger UI

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

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 6.0+
- Redis (optional, for rate limiting)

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secrets, etc.
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```
   Server runs on http://localhost:5000

4. **Access API docs:**
   - Swagger UI: http://localhost:5000/api/swagger-ui/
   - Health Check: http://localhost:5000/api/health/

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```
   App runs on http://localhost:3000

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## API Documentation

Complete API documentation: [backend/API.md](backend/API.md)

**Main Endpoints:**
- `POST /api/auth/login` - Login
- `GET /api/feed` - Posts feed
- `POST /api/profile/posts` - Create post
- `GET /api/social/posts/<id>/likes` - Get likes
- `GET /api/social/posts/<id>/comments` - Get comments
- `GET /api/notifications` - Get notifications

---

## Use Cases

- **Developer Portfolios**: Showcase projects with code and documentation
- **Tech Communities**: Share knowledge and collaborate
- **Project Discovery**: Find interesting projects by technology stack
- **Social Learning**: Learn from others' implementations
- **Team Collaboration**: Share work-in-progress projects

---

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
