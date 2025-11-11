"""
Posts Creation Routes

Handles creating new project posts with file uploads using MongoDB GridFS.

Endpoints:
- POST /posts (with file upload)
"""

from flask_restx import Namespace
from src.logger import logger


# Namespace
posts_ns = Namespace("posts", description="Project posts creation operations")
