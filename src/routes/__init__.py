"""
Routes for the API
"""

from .auth import auth_ns
from .health import health_ns

__all__ = ["auth_ns", "health_ns"]