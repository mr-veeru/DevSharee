"""
DevShare - Social Platform for Developers

A production-ready Flask API for project sharing, user interactions, and notifications.

Author: Veerendra
Version: 1.0.0
"""

from flask import Flask, jsonify
from flask_cors import CORS
from src.config import Config
from src.extensions import mongo, jwt, api, limiter
from src.routes import auth_ns, health_ns, posts_ns, profile_ns, feed_ns, likes_ns, comments_ns, replies_ns, register_error_handlers


def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend
    CORS(app, origins=["http://localhost:3000"])

    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    api.init_app(app)
    limiter.init_app(app)

    # Add namespaces to API
    api.add_namespace(auth_ns, path="/auth")
    api.add_namespace(health_ns, path="/health")
    api.add_namespace(posts_ns, path="/posts")
    api.add_namespace(profile_ns, path="/profile")
    api.add_namespace(feed_ns, path="/feed")
    api.add_namespace(likes_ns, path="/social/likes")
    api.add_namespace(comments_ns, path="/social/comments")
    api.add_namespace(replies_ns, path="/social/replies")
    
    # Register global error handlers
    register_error_handlers(app)

    # Home route
    @app.route('/')
    def home():
        """Simple home endpoint"""
        return jsonify({
            "message": "DevShare is running",
            "status": "healthy",
            "version": "1.0.0",
            "endpoints": {
                "swagger": "/api/swagger-ui/",
                "health": "/api/health/",
                "posts": "/api/posts/",
                "profile": "/api/profile/",
                "feed": "/api/feed/",
                "social": {
                    "likes": "/api/social/likes/",
                    "comments": "/api/social/comments/",
                    "replies": "/api/social/replies/"
                }
            }
        })
    

    return app

# Create the Flask app instance
app = create_app()

if __name__ == "__main__":
    # Run server in debug mode for development
    app.run(debug=True)
