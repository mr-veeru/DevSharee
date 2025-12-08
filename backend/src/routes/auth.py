"""
Authentication Routes

Handles user registration, login, logout, and refresh token.

Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
"""

from flask import request
from flask_restx import Namespace, Resource, fields
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from src.extensions import mongo, limiter
from src.logger import logger
import datetime
import re
from src.models import create_auth_models
import time

# Namespace
auth_ns = Namespace("auth", description="Authentication operations")


# JWT Token Blacklist Callback
def check_if_token_revoked(jwt_header, jwt_payload):
    """
    Check if a JWT token has been revoked (blacklisted).
    This callback is called automatically by Flask-JWT-Extended.
    Also cleans up expired blacklist entries automatically.
    """
    jti = jwt_payload["jti"]
    
    # Clean up expired blacklist entries (do this periodically, not on every check)
    # Only clean up if we haven't done it recently (to avoid performance issues)
    last_cleanup = getattr(check_if_token_revoked, '_last_cleanup', 0)
    current_time = time.time()
    if current_time - last_cleanup > 3600:  # Clean up once per hour
        cleanup_expired_blacklist_entries()
        check_if_token_revoked._last_cleanup = current_time
    
    # Check if token is in blacklist
    token = mongo.db.token_blacklist.find_one({"jti": jti})
    if not token:
        return False
    
    # If token has expired, remove it from blacklist and return False
    if token.get("expires_at"):
        expires_at = token["expires_at"]
        current_timestamp = datetime.datetime.utcnow().timestamp()
        # expires_at is stored as Unix timestamp (int/float)
        if isinstance(expires_at, (int, float)) and expires_at < current_timestamp:
            mongo.db.token_blacklist.delete_one({"jti": jti})
            return False
    
    return True


def cleanup_expired_blacklist_entries():
    """
    Remove expired blacklist entries from the database.
    Called periodically to keep the blacklist collection clean.
    """
    try:
        current_timestamp = datetime.datetime.utcnow().timestamp()
        result = mongo.db.token_blacklist.delete_many({
            "expires_at": {"$lt": current_timestamp}
        })
        if result.deleted_count > 0:
            logger.info(f"Cleaned up {result.deleted_count} expired blacklist entries")
    except Exception as e:
        logger.error(f"Error cleaning up expired blacklist entries: {str(e)}")


# Regex validation patterns
PASSWORD_REGEX = r"^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!?])[A-Za-z\d@#$%&*!?]{8,}$"  # Requires: at least 8 chars, one uppercase, one digit, one special character
USERNAME_REGEX = r"^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{3,}$"  # Requires: at least 3 chars and alphanumeric only
EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"  # email validation

# ---------- Models for Swagger ----------
register_model, login_model = create_auth_models(auth_ns)


# ---------- Routes ----------
@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.expect(register_model)
    @limiter.limit("5 per minute")  # Prevent spam registrations
    def post(self):
        """
        Register a new user.

        Validates username, password, confirm_password, email.
        Sets default status as active.
        """
        data = request.get_json() or {}
        
        # Check for unexpected fields
        allowed_fields = {"username", "fullname", "email", "password", "confirm_password"}
        unexpected_fields = set(data.keys()) - allowed_fields
        if unexpected_fields:
            return {
                "message": f"Unexpected fields: {', '.join(unexpected_fields)}",
                "unexpected_fields": list(unexpected_fields),
                "expected_fields": list(allowed_fields)
            }, 400
        
        username = data.get("username", "").lower()
        fullname = data.get("fullname", "").strip()
        email = data.get("email", "").lower()
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        # Edge case: missing fields
        if not username or not fullname or not email or not password or not confirm_password:
            return {"message": "All fields are required"}, 400

        # Email validation
        if not re.match(EMAIL_REGEX, email):
            return {"message": "Invalid email format"}, 400

        # Username validation
        if not re.match(USERNAME_REGEX, username):
            return {"message": "Username must be at least 3 characters and alphanumeric only"}, 400

        # Password validation
        if not re.match(PASSWORD_REGEX, password):
            return {"message": "Password must be at least 8 characters with uppercase, digit, and special character (@#$%&*!?)"}, 400

        # Password match
        if password != confirm_password:
            return {"message": "Passwords and confirm passwords do not match"}, 400

        # Check if user/email exists
        if mongo.db.users.find_one({"$or": [{"email": email}, {"username": username}]}):
            return {"message": "User with this email or username already exists"}, 400

        # Create user
        user = {
            "username": username,
            "fullname": fullname,
            "email": email,
            "password": generate_password_hash(password),
            "status": "active",   # default active
            "created_at": datetime.datetime.utcnow()
        }
        mongo.db.users.insert_one(user)
        logger.info(f"Registered new user: {email}")
        return {"message": "User registered successfully"}, 201


@auth_ns.route("/login")
class Login(Resource):
    @auth_ns.expect(login_model)
    @limiter.limit("10 per minute")  # Prevent brute force attacks
    def post(self):
        """
        Login user using username or email and password.
        Returns access and refresh JWT tokens.
        """
        data = request.get_json() or {}
        
        # Check for unexpected fields
        allowed_fields = {"username_or_email", "password"}
        unexpected_fields = set(data.keys()) - allowed_fields
        if unexpected_fields:
            return {
                "message": f"Unexpected fields: {', '.join(unexpected_fields)}",
                "unexpected_fields": list(unexpected_fields),
                "expected_fields": list(allowed_fields)
            }, 400
        
        identifier = data.get("username_or_email", "").lower()
        password = data.get("password")

        if not identifier or not password:
            return {"message": "Both username/email and password are required"}, 400

        # Find user by email or username
        user = mongo.db.users.find_one({"$or": [{"email": identifier}, {"username": identifier}]})
        if not user or user.get("status") != "active":
            return {"message": "Invalid credentials or inactive user"}, 401

        if not check_password_hash(user["password"], password):
            return {"message": "Invalid credentials"}, 401

        # Create tokens with additional claims (JTI for blacklisting)
        access_token = create_access_token(identity=str(user["_id"]))
        refresh_token = create_refresh_token(identity=str(user["_id"]))

        logger.info(f"User logged in: {identifier}")
        return {"access_token": access_token, "refresh_token": refresh_token}, 200


@auth_ns.route("/logout")
class Logout(Resource):
    @jwt_required()
    def post(self):
        """
        Logout user by revoking JWT access token.
        Adds the token to blacklist so it cannot be used again.
        """
        jti = get_jwt()["jti"]  # JWT ID
        user_id = get_jwt_identity()
        
        # Add token to blacklist
        token_blacklist = {
            "jti": jti,
            "token_type": "access",
            "user_id": user_id,
            "revoked_at": datetime.datetime.utcnow(),
            "expires_at": get_jwt()["exp"]  # Store expiration for cleanup
        }
        mongo.db.token_blacklist.insert_one(token_blacklist)
        
        logger.info(f"User logged out: {user_id}, token JTI: {jti}")
        return {"message": "Successfully logged out"}, 200


@auth_ns.route("/refresh")
class Refresh(Resource):
    @jwt_required(refresh=True)
    @limiter.limit("20 per minute")  # Allow more refreshes than login attempts
    def post(self):
        """
        Refresh access token using a valid refresh token.
        Implements refresh token rotation - generates new refresh token and invalidates old one.
        Also blacklists the old access token if provided.
        """
        jti = get_jwt()["jti"]  # JWT ID of the old refresh token
        user_id = get_jwt_identity()
        # Handle optional JSON body (for access_token_jti) - allow empty body
        try:
            data = request.get_json() or {}
        except:
            data = {}
        access_token_jti = data.get("access_token_jti")
        
        # Blacklist the old refresh token
        refresh_token_blacklist = {
            "jti": jti,
            "token_type": "refresh",
            "user_id": user_id,
            "revoked_at": datetime.datetime.utcnow(),
            "expires_at": get_jwt()["exp"]  # Store expiration for cleanup
        }
        mongo.db.token_blacklist.insert_one(refresh_token_blacklist)
        
        # Blacklist the old access token if JTI is provided
        if access_token_jti:
            access_token_blacklist = {
                "jti": access_token_jti,
                "token_type": "access",
                "user_id": user_id,
                "revoked_at": datetime.datetime.utcnow(),
                "expires_at": None  # We don't have the expiry, but token will be checked against blacklist
            }
            mongo.db.token_blacklist.insert_one(access_token_blacklist)
            logger.info(f"Token refreshed for user: {user_id}, old refresh token JTI: {jti} and old access token JTI: {access_token_jti} blacklisted")
        else:
            logger.info(f"Token refreshed for user: {user_id}, old refresh token JTI: {jti} blacklisted")
        
        return {
            "access_token": create_access_token(identity=user_id),
            "refresh_token": create_refresh_token(identity=user_id)
        }, 200
