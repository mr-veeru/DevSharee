"""
Social Interactions Package Initialization

All social interaction routes (likes, comments, replies) use a single namespace.
"""

from flask_restx import Namespace

# Single namespace for all social interactions
social_ns = Namespace("social", description="Social interactions (likes, comments, replies)")

# Import routes from each module (they will use the shared namespace)
# These imports must happen after social_ns is defined to avoid circular imports
from . import likes
from . import comments
from . import replies

__all__ = ["social_ns"]
