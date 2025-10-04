# DevShare

A social platform for developers to create and share their projects.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up MongoDB Atlas:
   - Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a database user with read/write permissions
   - Get your connection string

3. Create `.env` file:
   ```bash
   copy .env.example .env
   ```
   Then update `.env` with your actual values:
   ```
   SECRET_KEY=your_secret_key
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=AppName
   JWT_SECRET_KEY=your_jwt_secret
   ```

4. Run the application:
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Documentation

- **Swagger UI**: `http://localhost:5000/api/swagger-ui/`
- **API Spec**: `http://localhost:5000/api/swagger.json`

## API Endpoints

### Health Check
- `GET /` - Basic health check and API information
- `GET /api/health/` - Comprehensive health check (database, JWT, Flask config)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get user profile

## Project Structure

```
DevSharee/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # Project documentation
└── src/
    ├── config.py       # Configuration
    ├── extensions.py   # Flask extensions
    ├── logger.py       # Logging setup
    └── routes/
        ├── __init__.py
        ├── auth.py     # Authentication routes
        └── health.py   # Health check routes
```
