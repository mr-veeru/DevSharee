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

### **Profile** (`/api/profile/`)
- `GET /` - Get current user's profile information
- `PUT /` - Update user profile (fullname, username, email, bio)
- `PUT /change-password` - Change user password
- `DELETE /delete-account` - Delete user account with complete cascade cleanup:
  - All user posts and GridFS files
  - All likes, comments, replies (on user's posts and made by user)
  - All comment/reply likes
  - All blacklisted JWT tokens
- `GET /posts` - Get user's own posts (with pagination)
- `GET /posts/<post_id>` - Get specific post details (own posts only)
- `PUT /posts/<post_id>` - Edit user's own post (owner only)
- `DELETE /posts/<post_id>` - Delete user's own post with cascade cleanup:
  - All GridFS files
  - All likes, comments, replies
  - All comment/reply likes
- `GET /posts/<post_id>/files/<file_id>` - Download files from own posts
- `GET /users/<user_id>` - Get any user's public profile information
- `GET /users/<user_id>/posts` - Get any user's posts (with pagination)

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
- `PUT /comments/<comment_id>` - Edit a comment (owner only, 403 if unauthorized)
- `DELETE /comments/<comment_id>` - Delete a comment with cascade cleanup (owner or post owner, 403 if unauthorized):
  - All replies to the comment
  - All likes on the comment and replies

#### **Replies**
- `POST /comments/<comment_id>/replies` - Add a reply to a comment
- `GET /comments/<comment_id>/replies` - Get all replies for a comment
- `PUT /replies/<reply_id>` - Edit a reply (owner only, 403 if unauthorized)
- `DELETE /replies/<reply_id>` - Delete a reply with cascade cleanup (owner or post owner, 403 if unauthorized):
  - All likes on the reply

### **Notifications** (`/api/notifications/`)
- `GET /` - List current user's notifications with pagination (newest first)
  - Query parameters: `page` (default: 1), `limit` (default: 20, max: 100)
  - Response headers: `X-Total-Count`, `X-Page`, `X-Limit`
- `GET /unread_count` - Get unread notifications count for current user
- `POST /mark_all_read` - Mark all notifications as read for current user
- `POST /<notif_id>/read` - Mark a single notification as read
- `DELETE /<notif_id>` - Delete a single notification (owner only)
- `POST /clear_all` - Delete all notifications for current user

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` – Successful request
- `201 Created` – Resource successfully created
- `400 Bad Request` – Invalid input
- `401 Unauthorized` – Missing or invalid token
- `403 Forbidden` – Access denied (unauthorized operation)
- `404 Not Found` – Resource not found or no permission
- `500 Internal Server Error` – Unexpected server error
