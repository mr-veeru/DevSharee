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

---

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

### **Posts** (`/api/posts/`)
- `POST /` - Create new post with file uploads (multipart/form-data)

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` – Successful request
- `201 Created` – Resource successfully created
- `400 Bad Request` – Invalid input
- `401 Unauthorized` – Missing or invalid token
- `403 Forbidden` – Access denied
- `404 Not Found` – Resource not found
- `500 Internal Server Error` – Unexpected server error
