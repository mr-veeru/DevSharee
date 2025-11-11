"""
Feed Routes

Handles retrieving posts for the main feed and individual post details.

Endpoints:
- GET /feed - List all posts with pagination and search
- GET /feed/<post_id> - Get single post by ID with full details
"""

from flask_restx import Namespace
from src.logger import logger


# Namespace
feed_ns = Namespace("feed", description="Posts feed operations")
