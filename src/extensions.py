"""
DevShare Extensions

Initialize all third-party extensions here.
"""

from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_restx import Api

# MongoDB extension
mongo = PyMongo()

# JWT extension for authentication
jwt = JWTManager()

# Flask-RESTX extension for API
api = Api(
    title="DevShare",
    description="Social Platform for Developers",
    doc="/api/swagger-ui/",
    prefix="/api",
    version="1.0.0"
)