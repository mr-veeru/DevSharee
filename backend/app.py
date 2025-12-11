"""
DevShare - Social Platform for Developers

Flask application entry point.
"""

from flask import Flask, jsonify
from src.config import Config
from flask_cors import CORS
from src.extensions import mongo, jwt, api, limiter
from src.routes import (auth_ns, health_ns, posts_ns, profile_ns, feed_ns, notifications_ns, social_ns, register_error_handlers)
from src.routes.auth import check_if_token_revoked
from src.logger import logger
from src.utils.db_indexes import create_indexes


def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Set request size limit
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
    
    # Initialize CORS
    if Config.CORS_ORIGINS == ["*"]:
        # Development: Allow all origins
        CORS(app, supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    else:
        # Production: Specific origins only
        CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    api.init_app(app)
    limiter.init_app(app)
    
    # Create database indexes for optimal query performance
    with app.app_context():
        create_indexes()
    
    # Register JWT Token Blacklist Callback
    jwt.token_in_blocklist_loader(check_if_token_revoked)
    
    # Register API namespaces
    api.add_namespace(auth_ns, path="/auth")
    api.add_namespace(health_ns, path="/health")
    api.add_namespace(posts_ns, path="/posts")
    api.add_namespace(profile_ns, path="/profile")
    api.add_namespace(feed_ns, path="/feed")
    api.add_namespace(notifications_ns, path="/notifications")
    api.add_namespace(social_ns, path="/social")
    
    # Register global error handlers
    register_error_handlers(app)
    
    # Add security headers to all responses
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses."""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response
    
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
                "auth": "/api/auth/",
                "health": "/api/health/",
                "posts": "/api/posts/",
                "profile": "/api/profile/",
                "feed": "/api/feed/",
                "notifications": "/api/notifications/",
                "social": "/api/social/"
            }
        })

    return app


# Create the Flask app instance
app = create_app()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
