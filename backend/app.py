"""
DevSharee - Social Platform for Developers

Flask application entry point.
"""

from flask import Flask, jsonify
from src.config import Config


def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Home route
    @app.route('/')
    def home():
        """Simple home endpoint"""
        return jsonify({
            "message": "DevSharee API",
            "status": "running"
        })

    return app


# Create the Flask app instance
app = create_app()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
