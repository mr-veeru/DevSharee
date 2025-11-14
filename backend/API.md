# DevShare Reference

Complete API documentation for the DevShare backend.

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

### **Feed** (`/api/feed/`)
- `GET /` - List all posts with pagination and search
- `GET /<post_id>` - Get single post by ID with full details
- `GET /posts/<post_id>/files/<file_id>` - Download a file from a post

### **Social Interactions** (`/api/social/`)

#### **Likes**
- `POST /posts/<post_id>/like` - Toggle like/unlike for a post
- `GET /posts/<post_id>/likes` - Get all likes for a post
- `POST /comments/<comment_id>/likes` - Toggle like/unlike for a comment
- `GET /comments/<comment_id>/likes` - Get all likes for a comment
- `POST /replies/<reply_id>/likes` - Toggle like/unlike for a reply
- `GET /replies/<reply_id>/likes` - Get all likes for a reply

#### **Comments**
- `POST /posts/<post_id>/comments` - Add a comment to a post
- `GET /posts/<post_id>/comments` - Get all comments for a post
- `PUT /comments/<comment_id>` - Edit a comment (owner only)
- `DELETE /comments/<comment_id>` - Delete a comment (owner or post owner)

#### **Replies**
- `POST /comments/<comment_id>/replies` - Add a reply to a comment
- `GET /comments/<comment_id>/replies` - Get all replies for a comment
- `PUT /replies/<reply_id>` - Edit a reply (owner only)
- `DELETE /replies/<reply_id>` - Delete a reply (owner or post owner)

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
