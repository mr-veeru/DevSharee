"""
Profile Management Routes

Handles user profile management operations including viewing, updating, password changes, and account deletion.

Endpoints:
- GET /profile - Get user profile information
- PUT /profile - Update user profile (fullname, username, email, bio)
- PUT /profile/change-password - Change user password
- DELETE /profile/delete-account - Delete user account with cascade cleanup
"""

from flask_restx import Namespace
from src.logger import logger


# Namespace
profile_ns = Namespace("profile", description="User profile and post management operations")
