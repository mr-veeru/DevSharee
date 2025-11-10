# DevSharee - Social Platform for Developers

A full-stack social platform for developers to create, share, and interact with projects. Built with Flask backend and React TypeScript frontend.

## Architecture Overview

```
DevSharee/
├── 📁 backend/                         # Flask REST API
│   ├── 📄 app.py                       # Main application entry point
│   ├── 📄 requirements.txt             # Python dependencies
│   ├── 📄 .env.example                 # Environment variables template
│   └── 📁 src/
│       ├── 📄 config.py                # Environment configuration
│       └── 📁 routes/                  # API endpoints
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
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your configuration values:
   # - SECRET_KEY: Flask secret key (optional, defaults to dev key)
   # - FLASK_ENV: Environment (development/production)
   # - DEBUG: Enable debug mode (True/False)
   ```

3. **Run the application:**
   ```bash
   python app.py  # Runs on http://localhost:5000
   ```

## Project Status

🚧 **Initial Setup** - This project is in its initial setup phase with a basic Flask backend structure.

## Future Features

- JWT authentication
- MongoDB database integration
- User profiles and posts
- Social interactions (likes, comments, replies)
- Real-time notifications
- File uploads and management
- React TypeScript frontend

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
