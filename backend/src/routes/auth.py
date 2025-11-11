"""
Authentication Routes

Handles user registration, login, logout, and refresh token.

Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
"""

from flask_restx import Namespace
from src.logger import logger


# Namespace
auth_ns = Namespace("auth", description="Authentication operations")
