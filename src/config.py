"""
DevShare Configuration

Flask app configuration.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Flask app configuration"""
    SECRET_KEY = os.environ.get("SECRET_KEY", "devshare_secret")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/devshare")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt_secret")
