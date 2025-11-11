"""
DevSharee Extensions

Initialize all Flask extensions here.
"""

from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_restx import Api
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

# MongoDB extension
mongo = PyMongo()

# JWT extension for authentication
jwt = JWTManager()

# Flask-RESTX extension for API documentation
api = Api(
    title="DevSharee API",
    description="Social Platform for Developers",
    doc="/api/swagger-ui/",
    prefix="/api",
    version="1.0.0"
)

# Rate limiter extension
# Uses memory storage by default, can be configured to use Redis
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URL", "memory://"),
    swallow_errors=True  # Don't fail if storage is unavailable
)

