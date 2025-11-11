"""
DevSharee - Social Platform for Developers

Flask application entry point.
"""

from flask import Flask, jsonify
from src.config import Config
from flask_cors import CORS
from src.extensions import mongo, jwt, api, limiter


def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize CORS
    if Config.CORS_ORIGINS == ["*"]:
        # Development: Allow all origins
        CORS(app, supports_credentials=True)
    else:
        # Production: Specific origins only
        CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    
    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    api.init_app(app)
    limiter.init_app(app)
    
    # Test database connection
    try:
        # Test MongoDB connection
        mongo.db.command('ping')
        app.logger.info("MongoDB connection successful")
    except Exception as e:
        app.logger.warning(f"MongoDB connection failed: {str(e)}")
        app.logger.warning("Application will continue but database operations may fail")

    # Home route
    @app.route('/')
    def home():
        """Simple home endpoint"""
        return jsonify({
            "message": "DevSharee API",
            "status": "running",
            "version": "1.0.0",
            "database": "connected" if mongo.db else "disconnected"
        })

    return app


# Create the Flask app instance
app = create_app()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
