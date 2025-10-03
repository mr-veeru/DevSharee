"""
DevShare - Developer Social Platform API

A production-ready Flask API for project sharing, user interactions, and notifications.

Author: Veerendra
Version: 1.0.0
"""

from flask import Flask, jsonify
from src.config import Config
from src.extensions import mongo, jwt


def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)

    # Home route
    @app.route('/')
    def home():
        """Simple home endpoint"""
        return jsonify({
            "message": "DevShare API is running",
            "status": "healthy",
            "version": "1.0.0",
            "endpoints": {
                "swagger": "/swagger-ui/",
            }
        })

    return app

# Create the Flask app instance
app = create_app()

if __name__ == "__main__":
    # Run server in debug mode for development
    app.run(debug=True)
