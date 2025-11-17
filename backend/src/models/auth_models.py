"""
Authentication Models

Flask-RESTx models for authentication endpoints.
"""

from flask_restx import fields


def create_auth_models(namespace):
    """Create authentication models for a namespace."""
    register_model = namespace.model("Register", {
        "username": fields.String(required=True, description="Unique username (3+ chars, alphanumeric)", min_length=3, max_length=20),
        "fullname": fields.String(required=True, description="Full name", min_length=1, max_length=100),
        "email": fields.String(required=True, description="Valid email address", pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"),
        "password": fields.String(required=True, description="Password (8+ chars, uppercase, digit, special char)", min_length=8),
        "confirm_password": fields.String(required=True, description="Confirm Password")
    })
    
    login_model = namespace.model("Login", {
        "username_or_email": fields.String(required=True, description="Email or username"),
        "password": fields.String(required=True, description="Password")
    })
    
    return register_model, login_model

