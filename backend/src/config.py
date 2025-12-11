"""
DevShare Configuration

Flask app configuration.
"""

import os
import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Flask app configuration"""
    SECRET_KEY = os.environ.get("SECRET_KEY")
    
    # MongoDB Configuration
    MONGO_URI = os.environ.get("MONGO_URI")
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=7)
    
    # CORS Configuration
    cors_origins_env = os.environ.get("CORS_ORIGINS", "")
    if cors_origins_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
        # Development: Allow all origins if not specified
        CORS_ORIGINS = ["*"]
    
    # Rate Limiting Configuration
    RATELIMIT_STORAGE_URL = os.environ.get("RATELIMIT_STORAGE_URL", "memory://")
    
    # Environment
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = os.environ.get("DEBUG", "False").lower() == "true"
    
    # Request size limits (64MB to match file upload aggregate limit)
    MAX_CONTENT_LENGTH = 64 * 1024 * 1024  # 64MB