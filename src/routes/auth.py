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
from src.extensions import mongo, jwt
from src.logger import logger
from bson import ObjectId
import datetime
import re

# Namespace
auth_ns = Namespace("auth", description="Authentication operations")

# JWT token blacklist for logout
jwt_blocklist = set()

# Regex validation patterns
PASSWORD_REGEX = r"^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!?])[A-Za-z\d@#$%&*!?]{8,}$"  # Requires: at least 8 chars, one uppercase, one digit, one special character
USERNAME_REGEX = r"^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{3,}$"  # Requires: at least 3 chars and alphanumeric only
EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"  # email validation

# ---------- Models for Swagger ----------
register_model = auth_ns.model("Register", {
    "username": fields.String(required=True, description="Unique username (3+ chars, alphanumeric)", min_length=3, max_length=20),
    "email": fields.String(required=True, description="Valid email address", pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"),
    "password": fields.String(required=True, description="Password (8+ chars, uppercase, digit, special char)", min_length=8),
    "confirm_password": fields.String(required=True, description="Confirm Password")
})

login_model = auth_ns.model("Login", {
    "username_or_email": fields.String(required=True, description="Email or username"),
    "password": fields.String(required=True, description="Password")
})


# ---------- Routes ----------
@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.expect(register_model)
    def post(self):
        """
        Register a new user.

        Validates username, password, confirm_password, email.
        Sets default status as active.
        """
        data = request.get_json() or {}
        
        # Debug MongoDB connection
        logger.info(f"MongoDB object: {mongo}")
        logger.info(f"MongoDB db: {mongo.db}")
        
        # Check for unexpected fields
        allowed_fields = {"username", "email", "password", "confirm_password"}
        unexpected_fields = set(data.keys()) - allowed_fields
        if unexpected_fields:
            return {
                "message": f"Unexpected fields: {', '.join(unexpected_fields)}",
                "unexpected_fields": list(unexpected_fields),
                "expected_fields": list(allowed_fields)
            }, 400
        
        username = data.get("username", "").lower()
        email = data.get("email", "").lower()
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        # Edge case: missing fields
        if not username or not email or not password or not confirm_password:
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

        access_token = create_access_token(identity=str(user["_id"]), expires_delta=datetime.timedelta(hours=1))
        refresh_token = create_refresh_token(identity=str(user["_id"]))

        logger.info(f"User logged in: {identifier}")
        return {"access_token": access_token, "refresh_token": refresh_token}, 200


@auth_ns.route("/logout")
class Logout(Resource):
    @jwt_required()
    def post(self):
        """
        Logout user by adding JWT to blocklist.
        """
        jti = get_jwt()["jti"]
        jwt_blocklist.add(jti)
        logger.info(f"User logged out: {get_jwt_identity()}")
        return {"message": "Successfully logged out"}, 200


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """
    Check if a JWT exists in the blocklist.
    """
    jti = jwt_payload["jti"]
    return jti in jwt_blocklist


@auth_ns.route("/refresh")
class Refresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        """
        Refresh access token using a valid refresh token.
        """
        user_id = get_jwt_identity()
        new_access = create_access_token(identity=user_id, expires_delta=datetime.timedelta(hours=1))
        return {"access_token": new_access}, 200
