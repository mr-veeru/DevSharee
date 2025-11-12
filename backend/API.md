# DevSharee API Reference

Complete API documentation for the DevSharee backend.

## Base URL
```
http://localhost:5000/api
```

## API Documentation
```
http://localhost:5000/api/swagger-ui/
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### **Health Check** (`/api/health/`)
- `GET /` - System health status (database, JWT, Flask configuration)

### **Authentication** (`/api/auth/`)
- `POST /register` - User registration with validation
- `POST /login` - User authentication (username/email + password)
- `POST /logout` - Token blacklisting
- `POST /refresh` - Refresh token rotation
