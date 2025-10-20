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
    MONGO_URI = os.environ.get("MONGO_URI")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    
    # JWT Token Expiration Settings
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=7)
